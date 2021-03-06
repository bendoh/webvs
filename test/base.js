/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


function logGLCall(functionName, args) {   
   console.log("gl." + functionName + "(" + 
      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
} 

/**
 * Create a Shader Test
 * this setsup a scaffold canvas for the test to
 * be run on. The canvas and the webgl context are passed
 * to the test function
 */
function CanvasTest() {
    var testFunc = arguments[arguments.length-1];
    var extraOptions = arguments[arguments.length-2];
    var hasExtraOptions = true;
    if(!_.isObject(extraOptions)) {
        extraOptions = {};
        hasExtraOptions = false;
    }
    extraOptions = _.defaults(extraOptions, {
        canvasSize: [100, 100],
        async: false,
        glDebug: false
    });
    var wrapper = function() {
        var canvas = document.getElementById("test_canvas");
        if(!canvas) {
            canvas = document.createElement("canvas");
            canvas.setAttribute("id", "test_canvas");
            document.body.appendChild(canvas);
        }
        canvas.width = extraOptions.canvasSize[0];
        canvas.height = extraOptions.canvasSize[1];
        var gl = canvas.getContext("webgl", {
            alpha: false,
            preserveDrawingBuffer: true
        });
        if(extraOptions.glDebug) {
            gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
        }
        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        testFunc(canvas, gl);
    }
    var testArgs
    if(hasExtraOptions) {
        testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-2);
    } else {
        testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    }
    testArgs.push(wrapper);
    if(extraOptions.async) {
        asyncTest.apply(window, testArgs);
    } else {
        test.apply(window, testArgs);
    }
}

function CanvasTestWithFM() {
    var testFunc = arguments[arguments.length-1];
    var wrapper = function(canvas, gl) {
        var copier = new Webvs.CopyProgram({dynamicBlend: true});
        copier.init(gl);
        var fm = new Webvs.FrameBufferManager(canvas.width, canvas.height, gl, copier, false);
        var promise = testFunc(canvas, gl, fm, copier);
        if(promise) {
            promise.onResolve(function() {
                fm.destroy();
            });
        } else {
            fm.destroy();
        }
    };
    var testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    testArgs.push(wrapper);
    CanvasTest.apply(window, testArgs);
}

function TriangleProgram(options) {
    TriangleProgram.super.constructor.call(this, _.defaults(options||{}, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1.0));",
            "}"
        ]
    }));
}
TriangleProgram = Webvs.defineClass(TriangleProgram, Webvs.ShaderProgram, {
    draw: function(color, x, y) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(Webvs.parseColorNorm(color)));
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                -0.8+x, -0.6+y,
                0.46+x, -0.5+y,
                -0.7+x, 0.7+y
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }
});

function GradientProgram() {
    GradientProgram.super.constructor.call(this, {
        fragmentShader: [
            "void main() {",
            "   setFragColor(vec4(v_position, 1, 1));",
            "}"
        ]
    });
}
GradientProgram = Webvs.defineClass(GradientProgram, Webvs.QuadBoxProgram);

function DummyAnalyser() {
    DummyAnalyser.super.constructor.call(this);
}
DummyAnalyser = Webvs.defineClass(DummyAnalyser, Webvs.AnalyserAdapter, {
    isPlaying: function() {
        return true;
    },

    getWaveform: function() {
        var data = new Float32Array(512);
        _.times(512, function(i) {
            data[i] = Math.sin((i/512)*4*Math.PI)/2;
        });
        return data;
    },

    getSpectrum: function() {
        var data = new Float32Array(512);
        _.times(data.length, function(i) {
            data[i] = Math.sin((i/512)*Math.PI)*2-1;
        });

        return data;
    }
});

function DummyMain(canvas, copier) {
    this.canvas = canvas;
    this.registerBank = {};
    this.bootTime = (new Date()).getTime();
    this.analyser = new DummyAnalyser();
    this.copier = copier;
}
DummyMain = Webvs.defineClass(DummyMain, Object, {
    getResource: function(name) {
        var resource;
        resource = Webvs.Resources[name];
        if(!resource) {
            resource = name;
        }
        return resource;
    }
});

function DummyParent(fm) {
    this.fm = fm;
}
