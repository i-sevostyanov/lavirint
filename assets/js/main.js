var game = new Phaser.Game(1152, 868, Phaser.WEBGL, 'game');

var GameConsts = {
    gridsize: 64,
    bombTimer: 9,
    levelsInRow: 3
};

var Results = function () {
    var records = [];
    var lastLevel = localStorage.getItem('lastLevel');
    if (lastLevel != null) {
        lastLevel*=1;
        records = JSON.parse(localStorage.getItem('records'));
    } else {
        lastLevel = -1;
    }
    lastLevel = -1;

    var saveResult = function() {
        localStorage.setItem('records', JSON.stringify(records));
        localStorage.setItem('lastLevel', lastLevel);
    };

    this.levelRecord = function (level, result) {
        if (result == undefined) return records[level];
        if (records[level] == undefined || result < records[level]) {
            records[level] = result.toFixed(2);
            saveResult();
        }
    };

    this.lastLevel = function (level) {
        if (level == undefined) return lastLevel;
        lastLevel = level;
        saveResult();
    }
};

var bottomMenu = function (maxKeys, level, maxLevel, record) {
    var keysText = null;
    var timeText = null;
    var levelText = null;
    var recordText = null;

    var keys = maxKeys;

    var time = 0;

    var timer = null;

    create(level+1, maxLevel, record);

    game.add.text(1050, 780, 'Сброс: [R]', { font: "18px Arial", fill: "#fff", align: "center" });
    game.add.text(986, 805, 'Полный экран: [F]', { font: "18px Arial", fill: "#fff", align: "center" });

    function create(level, maxLevel, record) {
        if (record == undefined) {
            record = 0;
        }

        keysText = game.add.text(10, 780, 'Ключи: 0/' + keys, { font: "18px Arial", fill: "#fff", align: "center" });
        timeText = game.add.text(10, 805, 'Время: 0', { font: "18px Arial", fill: "#fff", align: "center" });
        recordText = game.add.text(150, 805, 'Рекорд: ' + record, { font: "18px Arial", fill: "#fff", align: "center" });
        levelText = game.add.text(10, 830, 'Уровень: ' + level + '/' + maxLevel, { font: "18px Arial", fill: "#fff", align: "center" });

        timer = game.time.create(false);
        timer.loop(5, function() {
            time += 0.01;
            timeText.setText('Время: ' + time.toFixed(2));
        }, this);
        timer.start();
    }

    this.reset = function (maxKeys, level, maxLevel, record) {
        keysText.kill();
        timeText.kill();
        levelText.kill();
        recordText.kill();

        keys = maxKeys;
        time = 0;

        timer.stop();

        create(level+1, maxLevel, record);
    };

    this.updateKeys = function(value) {
        keysText.setText('Ключи: ' + value + '/' + keys);
    };

    this.getTime = function() {
        return time;
    };
};

var Player = function (player) {
    this.gameObject = player;
    this.playerSpeed = 600;

    this.setDirection = function(direction) {
        this.gameObject.body.velocity.y = 0;
        this.gameObject.body.velocity.x = 0;
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
    };

    this.normalizePosition = function() {
        var i = (this.getBody().center.x) / GameConsts.gridsize;
        var j = (this.getBody().center.y) / GameConsts.gridsize;
        if (i - Math.floor(i) != 0.5 && i - Math.floor(i) != 0
            || j - Math.floor(j) != 0.5 && j - Math.floor(j) != 0) {
            this.getBody().position.x = Math.floor(i) * GameConsts.gridsize;
            this.getBody().position.y = Math.floor(j) * GameConsts.gridsize;
        }
    }
};

var PhaserGame = function (game) {
    this.map = null;
    this.layer = null;
    this.player = null;

    this.results = new Results();

    this.current = Phaser.UP;

    this.player = null;

    this.keys = 0;
    this.maxKeys = 0;

    this.cursors = null;

    this.blocks = null;

    this.teleports = [];
    this.transfers = [];
    this.justTransfered = false;

    this.bottomMenu = null;

    this.level = 1;

    this.gameLevels = [
        [
            //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
            [0, 0, 0, 0, 0, 9, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 4
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 5
            [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 9, 0, 0, 0, 0, 1, 0], // 6
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // 7
            [0, 0, 0, 0, 1, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0], // 8
            [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 4, 0, 0], // 9
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        ],
        [
            //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], // 3
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // 4
            [0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 1, 2, 0, 1, 0, 0, 0, 0], // 5
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // 6
            [0, 0, 0, 0, 0, 0, 0, 1, 9, 0, 0, 0, 0, 1, 0, 0, 0, 0], // 7
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1, 1, 0, 0, 0, 0, 0], // 8
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 9
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        ],
        [
            //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
            [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0], // 4
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 5
            [0, 0, 0, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 6
            [0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 7
            [0, 0, 0, 0, 0, 0, 1, 0, 8, 0, 0, 2, 0, 0, 0, 0, 0, 0], // 8
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 9
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        ],
        [
            //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0], // 4
            [0, 0, 0, 0, 0, 0, 3, 8, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0], // 5
            [0, 0, 0, 0, 0, 0, 0, 8, 9, 2, 9, 8, 0, 0, 0, 0, 0, 0], // 6
            [0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 8, 0, 0, 0, 0, 0, 0], // 7
            [0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 8
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 9
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        ],
        [
            //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 4
            [0, 0, 3, 0, 0, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0], // 5
            [0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0], // 6
            [0, 0, 0, 0, 0, 9, 0, 0, 1, 0, 0, 9, 0, 0, 0, 0, 0, 0], // 7
            [0, 0, 0, 0, 1, 9, 9, 9, 9, 9, 9, 9, 1, 0, 0, 0, 0, 0], // 8
            [0, 0, 0, 0, 0, 9, 0, 0, 9, 0, 0, 9, 0, 0, 0, 0, 0, 0], // 9
            [0, 0, 0, 0, 0, 9, 0, 0, 9, 0, 0, 9, 0, 0, 0, 0, 0, 0], // 10
            [0, 0, 0, 0, 1, 9, 9, 9, 9, 9, 9, 9, 1, 0, 0, 0, 0, 0], // 11
            [0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0],  // 12
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 3
        ],
        [
            //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // 4
            [0, 0, 0, 0, 0, 1, 9, 9, 9, 9, 0, 0, 1, 0, 0, 0, 0, 0], // 5
            [0, 0, 0, 0, 0, 0, 9, 1, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0], // 6
            [0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 3, 1, 9, 0, 0, 0, 0, 0], // 7
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 9, 9, 9, 9, 1, 0, 0, 0, 0], // 8
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0], // 9
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        ]
            //
            //[
            ////1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
            //[0, 0, 0, 0, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 0, 0, 0, 0], // 1
            //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 2
            //    [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 9], // 3
            //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 4
            //    [0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 5
            //    [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 9], // 6
            //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 7
            //    [0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 8
            //    [9, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9], // 9
            //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
            //    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
            //    [0, 1, 2, 0, 0, 0, 0, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
            //],
        //[
        //    //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
        //    [0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3
        //    [0, 7, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 4
        //    [0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 5
        //    [0, 6, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 6
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 7
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 8
        //    [0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 9
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        //]
        //[
        //    // DEFAULT
        //    //   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
        //    [0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 4
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 5
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0], // 6
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 7
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 8
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 9
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 11
        //    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 12
        //]
    ];

    this.swipe = null;

    this.level = this.results.lastLevel();
    if (this.level >= this.gameLevels.length) this.level = 0;

    this.blocksHandlerPreOverlap = function (player, block) {
        var dX = player.body.position.x - block.body.position.x;
        var dY = player.body.position.y - block.body.position.y;
        if (Math.abs(dX) < 6  && Math.abs(dY) < 6 && block.name != '') {
            if (dX != 0 || dY != 0) {
                player.position.x -= dX;
                player.position.y -= dY;

                if (block.name == '') {
                    player.body.position.x = Math.floor(player.body.position.x / this.gridsize) * this.gridsize;
                    player.body.position.y = Math.floor(player.body.position.y / this.gridsize) * this.gridsize;
                }
            }
            return true;
        }
        return false;
    };

    this.blocksHandlerOverlap = function (player, block) {
        switch (block.name) {
            case 'triangle0':
                if (player.body.velocity.x != 0) {
                    this.player.setDirection(Phaser.UP);
                } else {
                    this.player.setDirection(Phaser.LEFT);
                }
                return false;
                break;
            case 'triangle1':
                if (player.body.velocity.x != 0) {
                    this.player.setDirection(Phaser.DOWN);
                } else {
                    this.player.setDirection(Phaser.LEFT);
                }
                return false;
                break;
            case 'triangle2':
                if (player.body.velocity.x != 0) {
                    this.player.setDirection(Phaser.DOWN);
                } else {
                    this.player.setDirection(Phaser.RIGHT);
                }
                return false;
                break;
            case 'triangle3':
                if (player.body.velocity.x != 0) {
                    this.player.setDirection(Phaser.UP);
                } else {
                    this.player.setDirection(Phaser.RIGHT);
                }
                return false;
                break;
            case 'finish':
                if (this.keys == this.maxKeys) {
                    block.kill();
                    this.results.levelRecord(this.level, this.bottomMenu.getTime());
                    this.level++;
                    this.results.lastLevel(this.level);
                    this.create();
                }
                break;
            case 'key':
                this.keys++;
                this.bottomMenu.updateKeys(this.keys);
                block.kill();
                break;
            case 'teleport':

                if (!this.justTransfered) {
                    var sx = Math.floor(block.body.position.x / GameConsts.gridsize) * GameConsts.gridsize;
                    var sy = Math.floor(block.body.position.y / GameConsts.gridsize) * GameConsts.gridsize;
                    var key = sx + 'x' + sy;

                    player.body.position.x = this.transfers[key].x;
                    player.body.position.y = this.transfers[key].y;
                    this.justTransfered = true;
                }

                break;
            case 'arrows':
                if (block.angle == 0) {
                    this.player.setDirection(Phaser.RIGHT);
                } else if (block.angle == 90) {
                    this.player.setDirection(Phaser.DOWN);
                } else if (block.angle == -180) {
                    this.player.setDirection(Phaser.LEFT);
                } else {
                    this.player.setDirection(Phaser.UP);
                }
                break;
        }
    };

    this.blocksHandlerCollide = function (player, block) {
        switch (block.name) {
            case 'bomb':
                block.name = 'bombWithTimer';
                var time = GameConsts.bombTimer;
                var text = game.add.text(block.position.x+33, block.position.y+21, time, { font: "26px Arial", fill: "#fff", align: "center" });
                var explode = block.animations.add('explode');
                setInterval(function() {
                    time--;
                    text.setText(time);
                    block.animations.play('explode', 1, true);
                    if (time <= 0) {
                        block.kill();
                        text.kill();
                    }
                }, 1000);
                break;
        }
    };
};

PhaserGame.prototype = {

    init: function () {
        this.physics.startSystem(Phaser.Physics.ARCADE);

        this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

        this.setInputs();
    },

    preload: function () {
        this.load.image('grid', 'assets/img/grid.png');
        this.load.image('block', 'assets/img/block.png');
        this.load.image('player', 'assets/img/player.png');
        this.load.image('finish', 'assets/img/finish.png');
        this.load.image('key', 'assets/img/key.png');
        this.load.image('triangle0', 'assets/img/triangle00.png');
        this.load.image('triangle1', 'assets/img/triangle01.png');
        this.load.image('triangle2', 'assets/img/triangle02.png');
        this.load.image('triangle3', 'assets/img/triangle03.png');
        this.load.image('arrows', 'assets/img/arrows.png');
        this.load.image('tunnel', 'assets/img/tunnel.png');
        this.load.spritesheet('button', 'assets/img/button.png', 80, 80, 3);
        this.load.image('teleport', 'assets/img/teleport.png');
        this.load.spritesheet('bomb', 'assets/img/bombanim.png', 64, 64, 10);
    },

    setInputs: function () {
        var key = this.input.keyboard.addKey(Phaser.Keyboard.R);
        key.onDown.add(this.create, this);

        key = this.input.keyboard.addKey(Phaser.Keyboard.F);
        key.onDown.add(this.fullScreen, this);

        key = this.input.keyboard.addKey(Phaser.Keyboard.M);
        key.onDown.add(this.openMenu, this);
    },

    fullScreen: function() {
        if (this.scale.isFullScreen) {
            this.scale.stopFullScreen();
        } else {
            this.scale.startFullScreen(false);
        }
    },

    create: function () {
        if (this.level == -1) {
            this.createMenu();
            return;
        }
        this.keys = 0;
        this.maxKeys = 0;
        if (this.blocks) {
            this.blocks.destroy();
            this.player.gameObject.kill();
        } else {
            this.add.sprite(0, 0, 'grid');
            this.swipe = new Swipe(this);
        }
        this.blocks = this.add.group();
        this.blocks.enableBody = true;
        var object;
        for (var i = 0; i < 12; i++) {
            for (var j = 0; j < 18; j++) {
                switch (this.gameLevels[this.level][i][j]) {
                    case 1:
                        object = this.blocks.create(j * GameConsts.gridsize, i * GameConsts.gridsize, 'block');
                        object.name = 'block';
                        object.body.immovable = true;
                        break;
                    case 2:
                        object = this.add.sprite(j * GameConsts.gridsize + GameConsts.gridsize / 2, i * GameConsts.gridsize + GameConsts.gridsize / 2, 'player');
                        this.physics.arcade.enable(object);
                        object.body.collideWorldBounds = true;
                        object.anchor.setTo(0.5, 0.5);
                        object.name = 'player';
                        this.player = new Player(object);
                        break;
                    case 3:
                        object = this.blocks.create(j * GameConsts.gridsize, i * GameConsts.gridsize, 'finish');
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
                        var rotate = this.gameLevels[this.level][i][j] - 4;
                        object = this.blocks.create(j * GameConsts.gridsize, i * GameConsts.gridsize, 'triangle' + rotate);

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
                        object.name = 'triangle' + rotate;
                        object.body.immovable = true;
                        break;
                    case 8:
                        object = this.blocks.create(j * GameConsts.gridsize, i * GameConsts.gridsize, 'bomb');
                        object.name = 'bomb';
                        object.body.immovable = true;
                        break;
                    case 9:
                        this.maxKeys++;
                        object = this.blocks.create(j * GameConsts.gridsize, i * GameConsts.gridsize, 'key');
                        object.name = 'key';
                        object.body.checkCollision.up = false;
                        object.body.checkCollision.left = false;
                        object.body.checkCollision.down = false;
                        object.body.checkCollision.right = false;
                        break;
                    case 10:
                        var x = j * GameConsts.gridsize;
                        var y = i * GameConsts.gridsize;
                        this.teleports.push({x: x, y: y});
                        object = this.blocks.create(x, y, 'teleport');
                        object.name = 'teleport';
                        object.body.checkCollision.up = false;
                        object.body.checkCollision.left = false;
                        object.body.checkCollision.down = false;
                        object.body.checkCollision.right = false;
                        break;
                    case 11:
                    case 12:
                    case 13:
                    case 14:
                        object = this.blocks.create(j * GameConsts.gridsize + GameConsts.gridsize / 2, i * GameConsts.gridsize + GameConsts.gridsize / 2, 'arrows');
                        object.body.checkCollision.up = false;
                        object.body.checkCollision.left = false;
                        object.body.checkCollision.down = false;
                        object.body.checkCollision.right = false;
                        object.anchor.setTo(0.5, 0.5);
                        object.angle = (this.gameLevels[this.level][i][j] - 11) * 90;
                        object.name = 'arrows';
                        object.body.immovable = true;
                        break;
                    case 15:
                    case 16:
                        object = this.blocks.create(j * GameConsts.gridsize + GameConsts.gridsize / 2, i * GameConsts.gridsize + GameConsts.gridsize / 2, 'tunnel');
                        if (this.gameLevels[this.level][i][j] == 15) {
                            object.body.checkCollision.up = false;
                            object.body.checkCollision.down = false;
                        } else {
                            object.body.checkCollision.left = false;
                            object.body.checkCollision.right = false;
                            object.angle = 90;
                        }
                        object.anchor.setTo(0.5, 0.5);
                        object.name = 'tunnel';
                        object.body.immovable = true;
                        break;
                }
            }
        }

        object = this.blocks.create(0, 768);
        object.body.immovable = true;
        object.name = 'bottomGround';
        object.body.setSize(1152, 0, 0, 0);

        if (this.teleports[0]) {
            var tx = this.teleports[0].x;
            var ty = this.teleports[0].y;

            this.transfers[tx + 'x' + ty] = this.teleports[1];

            tx = this.teleports[1].x;
            ty = this.teleports[1].y;

            this.transfers[tx + 'x' + ty] = this.teleports[0];
        }

        this.cursors = this.input.keyboard.createCursorKeys();

        this.createBottomMenu();
    },

    openMenu: function () {
        this.level = -1;
        this.create();
    },

    createMenu: function () {
        this.add.text(150, 50, 'Lavirint', { font: "36px Arial", fill: "#fff", align: "center" });
        this.add.text(150, 100, 'Выберите уровень: ', { font: "20px Arial", fill: "#fff", align: "center" });

        var x,y;
        for (var i = 0; i < this.gameLevels.length; i++) {
            x = (i % GameConsts.levelsInRow) * 100;
            y = Math.floor(i / GameConsts.levelsInRow) * 100;
            this.add.button(x + 150, y + 170, 'button', this.openLevel, this, 1, 0, 2).name = 'button' + i;
            this.add.text(x + 183, y + 185, i+1, { font: "30px Arial", fill: "#fff", align: "center" });
            if (this.results.levelRecord(i)) {
                this.add.text(x + 172, y + 215, this.results.levelRecord(i), {font: "15px Arial", fill: "#fff", align: "center"});
            }
        }
    },

    openLevel: function (button) {
        this.level = button.name.replace('button', '');
        this.create();
    },

    createBottomMenu: function () {
        if (!this.bottomMenu) {
            this.bottomMenu = new bottomMenu(this.maxKeys, this.level, this.gameLevels.length, this.results.levelRecord(this.level));
        } else {
            this.bottomMenu.reset(this.maxKeys, this.level, this.gameLevels.length, this.results.levelRecord(this.level));
        }
    },

    update: function () {
        if (this.level == -1) {

            return;
        }

        this.justTransfered = false;

        game.physics.arcade.overlap(this.player.gameObject, this.blocks, this.blocksHandlerOverlap, this.blocksHandlerPreOverlap, this);
        game.physics.arcade.collide(this.player.gameObject, this.blocks, this.blocksHandlerCollide, null, this);

        if (!this.player.getBody().velocity.y && !this.player.getBody().velocity.x) {
            this.player.normalizePosition();
            var direction = this.swipe.check();
            if (direction!==null) {
                switch(direction.direction) {
                    case this.swipe.DIRECTION_LEFT:
                        this.player.setDirection(Phaser.LEFT);
                        break;
                    case this.swipe.DIRECTION_RIGHT:
                        this.player.setDirection(Phaser.RIGHT);
                        break;
                    case this.swipe.DIRECTION_UP:
                        this.player.setDirection(Phaser.UP);
                        break;
                    case this.swipe.DIRECTION_DOWN:
                        this.player.setDirection(Phaser.DOWN);
                        break;
                }
            } else {
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
    }
};

game.state.add('Game', PhaserGame, true);