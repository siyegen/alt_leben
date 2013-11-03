console.log('moo');

var Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Touch, UI")
        .setup({ maximize: true })
        .controls().touch();

Q.gravityX = 0;
Q.gravityY = 0;

Q.component("drtControls", {
  defaults: {
    speed: 200,
    kyle_speed: 1000,
    min_speed: 400
  },

  added: function() {
    var p = this.entity.p;

    Q._defaults(p,this.defaults);

    this.entity.on("step",this,"step");
    //this.entity.on("bump.bottom",this,"landed");

    p.landed = 0;
    p.direction ='right';
  },

  step: function(dt) {
    var p = this.entity.p;

    if(Q.inputs['right']) {
      p.direction = 'right';
      p.vx = p.kyle_speed;
    } else if (!Q.inputs['up'] || Q.inputs['down']) {
      p.direction = 'right';
      temp = p.vx - p.kyle_speed/5;
      if (temp < 0) { temp = p.min_speed; }
      p.vx = temp;
    }

    if(Q.inputs['up']) {
      p.vy = -p.speed;
      p.direction = 'up';
    } else if(Q.inputs['down']) {
      p.direction = 'down';
      p.vy = p.speed;
    }

    if(Q.inputs['fire']) {
      var stage = Q.stage();
      stage.insert(new Q.Pew({ x: p.x+55, y: p.y}));
    }

  }
});

Q.Sprite.extend('Pew',{
  init: function(p) {
    this._super(p, { sheet: "enemy", vx:800});
  },
  step: function(dt) {
    this.p.x += this.p.vx * dt;
  }
});

Q.Sprite.extend("Player",{
  init: function(p) {
    this._super(p, { sheet: "player", x: 210, y: 190, vx: 0, vy: 0 });
    this.add('2d, drtControls');
    this._vel = 0;

    this.on("hit.sprite",function(collision) {
      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });
  },
  step: function(dt) {
    this.p.vx += 0.15;
    this.p.x += this.p.vx * dt;
  }
});

Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});

Q.Sprite.extend("Enemy",{
  init: function(p) {
    this._super(p, { sheet: 'enemy'});
    this.add('2d, aiBounce');

    this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
      if(collision.obj.isA("Player")) { 
        Q.stageScene("endGame",1, { label: "You Died" }); 
        collision.obj.destroy();
      }
      if(collision.obj.isA("Pew")) { 
        this.destroy();
        collision.obj.destroy();
        collision.obj.p.vy = -300;
      }
    });
  }
});

Q.scene("level1",function(stage) {
  stage.collisionLayer(new Q.TileLayer({ dataAsset: 'kyle_level.json', sheet: 'tiles' }));

  for( var i=0; i < 50; i++) {
    stage.insert(new Q.Enemy({ x: 600+i+95, y: 100+i+90, vx: 80*Math.random()}));
  }

  for( var i=0; i < 50; i++) {
    stage.insert(new Q.Enemy({ x: 1200+i+95, y: 500+i+90, vx: 1000*Math.random()}));
  }
  var player = stage.insert(new Q.Player());

  stage.add("viewport").follow(player);

  stage.insert(new Q.Tower({ x: 180, y: 50 }));
});

Q.scene('endGame',function(stage) {
  var box = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));
  
  var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                           label: "Play Again" }));
  var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
                                        label: stage.options.label }));
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('level1');
  });
  box.fit(20);
});

Q.load("kyle_sprites.png, sprites.json, kyle_level.json, tiles.png", function() {
  Q.sheet("tiles","tiles.png", { tilew: 32, tileh: 32 });
  Q.compileSheets("kyle_sprites.png","sprites.json");
  Q.stageScene("level1");
  console.log('loaded!');
});

