var game = new Phaser.Game(1152, 768, Phaser.AUTO, '', {preload: preload, create: create, update: update});
var blocks;
var triangles;
var player = null;
var finish = null;
var gameLevel = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];
var cursors;
var playerSpeed = 600;

function preload() {
    game.load.image('grid', 'assets/img/grid.png');
    game.load.image('block', 'assets/img/block.png');
    game.load.image('player', 'assets/img/player.png');
    game.load.image('triangle', 'assets/img/triangle.png');
}

function create() {
    game.add.sprite(0, 0, 'grid');
    blocks = game.add.group();
    blocks.enableBody = true;
    triangles = game.add.group();
    triangles.enableBody = true;
    for (var i = 0; i < 12; i++) {
        for (var j = 0; j < 18; j++) {
            switch (gameLevel[i][j]) {
                case 1:
                    blocks.create(j*64, i*64, 'block').body.immovable = true;
                    break;
                case 2:
                    player = game.add.sprite(j * 64, i * 64, 'player');
                    game.physics.arcade.enable(player);
                    player.body.collideWorldBounds = true;
                    break;
                case 3:
                    finish = game.add.group();
                    finish.enableBody = true;
                    finish.create(j*64, i*64, 'player');
                    break;
                case 4: // triangle top-right
                case 5: // triangle right-bottom
                case 6: // triangle bottom-left
                case 7: // triangle left-top
                    var rotation = (gameLevel[i][j] - 4) * 90;
                    var x = j*64;
                    var y = i*64;
                    triangles.create(x, y, 'triangle').angle = rotation;
                    break;
            }
        }
    }

    cursors = game.input.keyboard.createCursorKeys();
}

function update() {
    if (!player.body.velocity.y && !player.body.velocity.x) {
        if (cursors.down.isDown) {
            player.body.velocity.y = playerSpeed;
        }
        else if (cursors.up.isDown) {
            player.body.velocity.y = -playerSpeed;
        }
        else if (cursors.left.isDown) {
            player.body.velocity.x = -playerSpeed;
        }
        else if (cursors.right.isDown) {
            player.body.velocity.x = playerSpeed;
        }
    }
    game.physics.arcade.collide(player, blocks);
    //game.physics.arcade.collide(player, finish);
    game.physics.arcade.overlap(player, finish, finishHandler, null, this);
    game.physics.arcade.overlap(player, triangles, finishHandler, null, this);
}

function finishHandler(player, finish) {
    if (Math.round(player.position.x/10) == Math.round(finish.position.x/10) && Math.round(player.position.y/10) == Math.round(finish.position.y/10)) {
        finish.kill();
    }
}