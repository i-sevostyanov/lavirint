var game = new Phaser.Game(1152, 768, Phaser.CANVAS, 'game');

var Player = function (player) {
    this.gameObject = player;
    this.playerSpeed = 600;

    this.setDirection = function(direction) {
        switch (direction) {
            case Phaser.UP:
                this.gameObject.body.velocity.y = -this.playerSpeed;
                this.gameObject.angle = -90;
                break;
            case Phaser.DOWN:
                this.gameObject.body.velocity.y = this.playerSpeed;
                this.gameObject.angle = 90;
                break;
            case Phaser.LEFT:
                this.gameObject.body.velocity.x = -this.playerSpeed;
                this.gameObject.angle = 180;
                break;
            case Phaser.RIGHT:
                this.gameObject.body.velocity.x = this.playerSpeed;
                this.gameObject.angle = 0;
                break;
        }
    };

    this.getBody = function() {
        return this.gameObject.body;
    }
};

var PhaserGame = function (game) {
    this.map = null;
    this.layer = null;
    this.player = null;

    this.gridsize = 64;

    this.current = Phaser.UP;

    this.player = null;

    this.cursors = null;

    this.blocks = null;

    this.bombTimer = 9;

    this.gameLevel = [
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 1, 1, 0, 6, 0, 2, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    this.blocksHandlerOverlap2 = function (player, block) {
        var dX = player.body.position.x - block.body.position.x;
        var dY = player.body.position.y - block.body.position.y;
        if (Math.abs(dX) < 6  && Math.abs(dY) < 6) {
            if (dX != 0 || dY != 0) {
                player.position.x -= dX;
                player.position.y -= dY;
            }
            console.log('YEAH!', player.body.position, player.body._dx, player.body._dy);
            return true;
        }
        console.log(player.body.position, player.body._dx, player.body._dy);
        return false;
    };

    this.blocksHandlerOverlap = function (player, block) {
        //if (Phaser.Math.distancePow(player.position.x, player.position.y, block.body.center.x, block.body.center.y, 1))
        //console.log(Phaser.Math.distance(player.position.x, player.position.y, block.body.center.x, block.body.center.y))

        //if (Math.round(player.position.x / 10) != Math.round(block.body.center.x / 10)
        //    || player.position.y - player.body.newVelocity.y != block.body.center.y) return;

        //if (player.position.x != block.body.center.x
        // || player.position.y != block.body.center.y) return;

        switch (block.name) {
            case 'triangle':
                if (player.body.velocity.x != 0) {
                    player.body.velocity.y = -player.body.velocity.x;
                    player.body.velocity.x = 0;
                } else {
                    player.body.velocity.x = -player.body.velocity.y;
                    player.body.velocity.y = 0;
                }

                /*if (player.body.velocity.y == 0) {
                    player.position.y = block.body.center.y - player.body.newVelocity.y;
                }*/

                /*if (player.body.velocity.x == 0) {
                    player.position.x = block.body.center.x - player.body.newVelocity.x;
                }*/

                return false;
                break;
            case 'finish':
                block.kill();
                console.log('Вы победили!');
                break;
        }
    };

    this.blocksHandlerCollide = function (player, block) {
        switch (block.name) {
            case 'bomb':
                block.name = 'bombWithTimer';
                var time = this.bombTimer;
                var text = game.add.text(block.position.x+33, block.position.y+21, time, { font: "26px Arial", fill: "#fff", align: "center" });
                setInterval(function() {
                    time--;
                    text.setText(time);
                    if (time <= 0) {
                        block.kill();
                        text.kill();
                    }
                }, 1000);
                break;
        }
    };

    this.setDirection = function (direction) {

    }
};

PhaserGame.prototype = {

    init: function () {
        this.physics.startSystem(Phaser.Physics.ARCADE);
    },

    preload: function () {
        this.load.image('grid', 'assets/img/grid.png');
        this.load.image('block', 'assets/img/block.png');
        this.load.image('player', 'assets/img/player.png');
        this.load.image('finish', 'assets/img/player.png');
        this.load.image('triangle0', 'assets/img/triangle00.png');
        this.load.image('triangle1', 'assets/img/triangle01.png');
        this.load.image('triangle2', 'assets/img/triangle02.png');
        this.load.image('triangle3', 'assets/img/triangle03.png');
        this.load.image('bomb', 'assets/img/bomb.png');
    },

    create: function () {
        this.add.sprite(0, 0, 'grid');
        this.blocks = this.add.group();
        this.blocks.enableBody = true;
        var object;
        for (var i = 0; i < 12; i++) {
            for (var j = 0; j < 18; j++) {
                switch (this.gameLevel[i][j]) {
                    case 1:
                        object = this.blocks.create(j * this.gridsize, i * this.gridsize, 'block');
                        object.body.name = 'block';
                        object.body.immovable = true;
                        break;
                    case 2:
                        object = this.add.sprite(j * this.gridsize + this.gridsize / 2, i * this.gridsize + this.gridsize / 2, 'player');
                        this.physics.arcade.enable(object);
                        object.body.collideWorldBounds = true;
                        object.anchor.setTo(0.5, 0.5);
                        object.name = 'player';
                        //object.dirty = true;
                        this.player = new Player(object);
                        break;
                    case 3:
                        object = this.blocks.create(j * this.gridsize, i * this.gridsize, 'finish');
                        object.name = 'finish';
                        object.body.checkCollision.up = false;
                        object.body.checkCollision.left = false;
                        object.body.checkCollision.down = false;
                        object.body.checkCollision.right = false;
                        break;
                    case 4: // triangle top-right
                    case 5: // triangle right-bottom
                    case 6: // triangle bottom-left
                    case 7: // triangle left-top
                        var rotate = this.gameLevel[i][j] - 4;
                        object = this.blocks.create(j * this.gridsize, i * this.gridsize, 'triangle'+rotate);
                        //object.body.setSize(64, 0, 0, 0);

                        if (rotate == 0) {
                            object.body.checkCollision.up = false;
                            object.body.checkCollision.left = false;
                        } else if (rotate == 1) {
                            object.body.checkCollision.down = false;
                            object.body.checkCollision.left = false;
                        } else if (rotate == 2) {
                            object.body.checkCollision.down = false;
                            object.body.checkCollision.right = false;
                        } else {
                            object.body.checkCollision.up = false;
                            object.body.checkCollision.right = false;
                        }
                        object.name = 'triangle';
                        object.body.immovable = true;
                        break;
                    case 8:
                        object = this.blocks.create(j * this.gridsize, i * this.gridsize, 'bomb');
                        object.body.setSize(62, 62, 1, 1);
                        object.name = 'bomb';
                        object.body.immovable = true;
                        break;
                }
            }
        }

        this.cursors = this.input.keyboard.createCursorKeys();
    },

    update: function () {
        game.physics.arcade.overlap(this.player.gameObject, this.blocks, this.blocksHandlerOverlap, this.blocksHandlerOverlap2, this);
        game.physics.arcade.collide(this.player.gameObject, this.blocks, this.blocksHandlerCollide, null, this);
        game.physics.arcade.collide(this.player.gameObject, this.blocks);

        if (!this.player.getBody().velocity.y && !this.player.getBody().velocity.x) {
            if (this.cursors.down.isDown) {
                this.player.setDirection(Phaser.DOWN);
            }
            else if (this.cursors.up.isDown) {
                this.player.setDirection(Phaser.UP);
            }
            else if (this.cursors.left.isDown) {
                this.player.setDirection(Phaser.LEFT);
            }
            else if (this.cursors.right.isDown) {
                this.player.setDirection(Phaser.RIGHT);
            }
        }
    }
};

game.state.add('Game', PhaserGame, true);