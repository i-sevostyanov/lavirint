var game = new Phaser.Game(1152, 768, Phaser.CANVAS, 'game');

var PhaserGame = function (game) {
    this.map = null;
    this.layer = null;
    this.player = null;

    this.safetile = 1;
    this.gridsize = 64;

    this.speed = 150;
    this.threshold = 3;
    this.turnSpeed = 150;

    this.marker = new Phaser.Point();
    this.turnPoint = new Phaser.Point();

    this.directions = [null, null, null, null, null];
    this.opposites = [Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP];

    this.current = Phaser.UP;
    this.turning = Phaser.NONE;

    this.playerSpeed = 600;
    this.player = null;

    this.cursors = null;

    this.bombTimer = 9;

    this.gameLevel = [
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 8, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    this.interactiveHandlerOverlap = function (player, block) {
        if (Math.round(player.position.x / 10) != Math.round((block.position.x + 32) / 10)
            || Math.round(player.position.y / 10) != Math.round((block.position.y + 32) / 10)) return;
        switch (block.name) {
            case 'triangle':
                if (player.body.velocity.x) {
                    //player.body.velocity.y = -player.body.velocity.x;
                    player.body.velocity.x = 0;
                } else {
                    //player.body.velocity.x = -player.body.velocity.y;
                    player.body.velocity.y = 0;
                }
                player.position.x = block.position.x + 32;
                player.position.y = block.position.y + 32;
                break;
            case 'finish':
                block.kill();
                console.log('Вы победили!');
                break;
        }
    };

    this.interactiveHandlerCollide = function (player, block) {
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
        this.interactive = this.add.group();
        this.interactive.enableBody = true;
        var object;
        for (var i = 0; i < 12; i++) {
            for (var j = 0; j < 18; j++) {
                switch (this.gameLevel[i][j]) {
                    case 1:
                        this.blocks.create(j * 64, i * 64, 'block').body.immovable = true;
                        break;
                    case 2:
                        this.player = this.add.sprite(j * 64 + 32, i * 64 + 32, 'player');
                        this.physics.arcade.enable(this.player);
                        this.player.body.collideWorldBounds = true;
                        this.player.anchor.setTo(0.5, 0.5);
                        break;
                    case 3:
                        object = this.interactive.create(j * 64, i * 64, 'finish');
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
                        object = this.interactive.create(j * 64, i * 64, 'triangle'+rotate);

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
                        object = this.interactive.create(j * 64, i * 64, 'bomb');
                        object.name = 'bomb';
                        object.body.immovable = true;
                        break;
                }
            }
        }

        cursors = this.input.keyboard.createCursorKeys();
    },

    checkKeys: function () {

        if (this.cursors.left.isDown && this.current !== Phaser.LEFT) {
            this.checkDirection(Phaser.LEFT);
        }
        else if (this.cursors.right.isDown && this.current !== Phaser.RIGHT) {
            this.checkDirection(Phaser.RIGHT);
        }
        else if (this.cursors.up.isDown && this.current !== Phaser.UP) {
            this.checkDirection(Phaser.UP);
        }
        else if (this.cursors.down.isDown && this.current !== Phaser.DOWN) {
            this.checkDirection(Phaser.DOWN);
        }
        else {
            //  This forces them to hold the key down to turn the corner
            this.turning = Phaser.NONE;
        }

    },

    checkDirection: function (turnTo) {

        if (this.turning === turnTo || this.directions[turnTo] === null || this.directions[turnTo].index !== this.safetile) {
            //  Invalid direction if they're already set to turn that way
            //  Or there is no tile there, or the tile isn't index a floor tile
            return;
        }

        //  Check if they want to turn around and can
        if (this.current === this.opposites[turnTo]) {
            this.move(turnTo);
        } else {
            this.turning = turnTo;

            this.turnPoint.x = (this.marker.x * this.gridsize) + (this.gridsize / 2);
            this.turnPoint.y = (this.marker.y * this.gridsize) + (this.gridsize / 2);
        }

    },

    turn: function () {

        var cx = Math.floor(this.player.x);
        var cy = Math.floor(this.player.y);

        //  This needs a threshold, because at high speeds you can't turn because the coordinates skip past
        if (!this.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold)) {
            return false;
        }

        this.player.x = this.turnPoint.x;
        this.player.y = this.turnPoint.y;

        this.player.body.reset(this.turnPoint.x, this.turnPoint.y);

        this.move(this.turning);

        this.turning = Phaser.NONE;

        return true;

    },

    move: function (direction) {

        var speed = this.speed;

        if (direction === Phaser.LEFT || direction === Phaser.UP) {
            speed = -speed;
        }

        if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
            this.player.body.velocity.x = speed;
        } else {
            this.player.body.velocity.y = speed;
        }

        this.add.tween(this.player).to({angle: this.getAngle(direction)}, this.turnSpeed, "Linear", true);

        this.current = direction;

    },

    getAngle: function (to) {

        //  About-face?
        if (this.current === this.opposites[to]) {
            return "180";
        }

        if ((this.current === Phaser.UP && to === Phaser.LEFT) ||
            (this.current === Phaser.DOWN && to === Phaser.RIGHT) ||
            (this.current === Phaser.LEFT && to === Phaser.DOWN) ||
            (this.current === Phaser.RIGHT && to === Phaser.UP)) {
            return "-90";
        }

        return "90";

    },

    update: function () {
        game.physics.arcade.overlap(this.player, this.interactive, this.interactiveHandlerOverlap, null, this);
        game.physics.arcade.collide(this.player, this.interactive, this.interactiveHandlerCollide, null, this);
        game.physics.arcade.collide(this.player, this.blocks);

        if (!this.player.body.velocity.y && !this.player.body.velocity.x) {
            if (cursors.down.isDown) {
                this.player.body.velocity.y = this.playerSpeed;
            }
            else if (cursors.up.isDown) {
                this.player.body.velocity.y = -this.playerSpeed;
            }
            else if (cursors.left.isDown) {
                this.player.body.velocity.x = -this.playerSpeed;
            }
            else if (cursors.right.isDown) {
                this.player.body.velocity.x = this.playerSpeed;
            }
        }
    }
};

game.state.add('Game', PhaserGame, true);