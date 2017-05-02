"use strict";

var canvas;
var gl;

//var numVertices  = 36;
var numVertices = 42;

var r_increment = 5;
var rotX = -15;
var rotY = 5;
var rotZ = -100;
var ctm;
var world_to_camera = scalem(1, 1, -1);
var modelViewMatrixLoc;


    var positions = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 ),
        vec4(  0.75,  0.0, 0.0, 1.0 )   // added
    ];

    var colors = [
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];

// indices of the 12 triangles that compise the cube

var indices = [
    1, 0, 3,
    3, 2, 1,

    2, 3, 7,
    7, 6, 2,

    3, 0, 4,
    4, 7, 3,

    4, 5, 6,
    6, 7, 4,

    5, 4, 0,  
    0, 1, 5,

    // pyramid
    1, 2, 8,
    2, 6, 8,
    6, 5, 8,
    5, 1, 8
];

function colorCube()
{
    quad( 1, 0, 3, 2, 0 );
    quad( 3, 0, 4, 7, 2 );
    quad( 6, 5, 1, 2, 3 );
    quad( 4, 5, 6, 7, 4 );
    quad( 5, 4, 0, 1, 1 );

    triangle(3, 2, 8, 1 );
    triangle(2, 6, 8, 2 );  
    triangle(6, 7, 8, 3 ); 
    triangle(7, 3, 8, 4 );
}

function triangle(a, b, c, color) 
{
    var base = vertex_data.positions.length;

    // The color is the same for all 3 vertices
    var color = colors[color];
    // There are 3 positions for a triangle face.
    // a, b, c are indexes into the common position array   
    var vertices = [a, b, c];
    for ( var i = 0; i < vertices.length; ++i ) {
        // We resolve the actual position
        var position = positions[vertices[i]];
        vertex_data.positions.push(position);
        vertex_data.colors.push(color);
    }

    var indices = [ 0, 1, 2 ];
    for ( var i = 0; i < indices.length; ++i ) {
        vertex_data.indices.push(base + indices[i]);
    }
}

function quad(a, b, c, d, color_index)
{
    // We are about to add positions (and colors).  
    // Let's remember the current count, so when 
    // we build indexes, we can account for the 
    // positions/colors already added before this.
    var base = vertex_data.positions.length;

    // The color is the same for all 4 vertices
    var color = colors[color_index];
    // There are 4 positions for a quad face.
    // a, b, c, d are indexes into the common position array (8 unique 3D points)    
    var vertices = [a, b, c, d];
    for ( var i = 0; i < vertices.length; ++i ) {
        // We resolve the actual position
        var position = positions[vertices[i]];
        vertex_data.positions.push(position);
        vertex_data.colors.push(color);
    }

    // indices represent the triangles for the square face, 
    // they are indices into the entire set of vertices though, 
    // so we add a base
    var indices = [ 0, 1, 2, 0, 2, 3 ];
    for ( var i = 0; i < indices.length; ++i ) {
        vertex_data.indices.push(base + indices[i]);
    }
}

var vertex_data = {
    positions : [], 
    colors :[], 
    indices: []
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // builds the positionIndexes and colorIndexes
    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    
   

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertex_data.colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );



    var positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertex_data.positions), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );    
    

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertex_data.indices), gl.STATIC_DRAW);

    

    // obtain the model matrix uniform location from the shader
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );

    console.log(vertex_data);
    render();
}

window.onkeypress = function( event ) {
    var key = String.fromCharCode(event.keyCode);
    switch( key ) {

        case 'Y':
            rotY-= r_increment;
            break;
        case 'y':
            rotY+= r_increment;
            break;

        case 'X':
            rotX-= r_increment;
            break;
        case 'x':
            rotX+= r_increment;
            break;

        case 'Z':
            rotZ-= r_increment;
            break;
        case 'z':
            rotZ+= r_increment;
            break;
    }
};




function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    ctm = world_to_camera;
    ctm = mult(ctm, rotateX(rotX));
    ctm = mult(ctm, rotateY(rotY));
    ctm = mult(ctm, rotateZ(rotZ));
    
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(ctm) );
    
    
    gl.drawElements(gl.TRIANGLES, vertex_data.indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimFrame( render );
}


