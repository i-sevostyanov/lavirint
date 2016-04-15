var game = new Phaser.Game(1152, 768, Phaser.AUTO, '', {preload: preload, create: create, update: update});
var platforms;

function preload() {
    game.load.image('player', 'assets/img/player.png');
}

function create() {
    platforms = game.add.group();

    //var ground = platforms.create(0, game.world.height - 64, 'ground');

    //ground.scale.setTo(2, 2);
    //ground.body.immovable = true;

    //  Now let's create two ledges
    //var ledge = platforms.create(400, 400, 'ground');

    //ledge.body.immovable = true;

    //ledge = platforms.create(-150, 250, 'ground');

    //ledge.body.immovable = true;
}

function update() {

}