/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/13/13
 * Time: 12:45 AM
 * To change this template use File | Settings | File Templates.
 */

function FadeOut(options) {
    options = options?options:{};
    this.speed = options.speed?options.speed:1;
    this.color = options.color?options.color:[0,0,0];

    if(this.color.length != 3) {
        throw new Error("Invalid clear color, must be an array of 3");
    }
    for(var i = 0;i < this.color.length;i++) {
        this.color[i] = this.color[i]/255;
    }

    this.frameCount = 0;
    this.maxFrameCount = Math.floor(1/this.speed);

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   gl_Position = vec4(a_position, 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec3 u_color;",
        "void main() {",
        "   gl_FragColor = vec4(u_color, 1);",
        "}"
    ].join("\n");


    FadeOut.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(FadeOut, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ]),
            gl.STATIC_DRAW
        );

        this.positionLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            // do average blending
            gl.enable(gl.BLEND);
            gl.blendColor(0.5, 0.5, 0.5, 1);
            gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);

            gl.uniform3fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.disable(gl.BLEND);
        }
    }
});

window.Webvs.FadeOut = FadeOut;