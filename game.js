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
    boost_speed: 300,
    min_speed: 100,
    break_speed: 50
  },

  added: function() {
    var p = this.entity.p;

    Q._defaults(p,this.defaults);

    this.entity.on("step",this,"step");
    //this.entity.on("bump.bottom",this,"landed");

    p.direction ='right';
  },

  step: function(dt) {
    var p = this.entity.p;

    if(Q.inputs.right) {
      p.direction = 'right';
      p.vx = p.boost_speed;
    } if(Q.inputs.left) {
      //p.direction = 'left';
      p.vx = p.vx-p.break_speed;
      if(p.vx < p.min_speed ) { p.vx = p.min_speed; }
    }

    if(Q.inputs.up) {
      p.vy = -p.speed;
      p.direction = 'up';
    } else if(Q.inputs.down) {
      p.direction = 'down';
      p.vy = p.speed;
    } else {
      p.direction = null;
      p.vy = 0;
    }
  }
});

Q.Sprite.extend('Pew',{
  init: function(p) {
    this._super(p, { sheet: "enemy", type: (Q.SPRITE_ACTIVE | Q.SPRITE_FRIENDLY), vx: 800+p.player_vx});
    this.p.collisionMask = (Q.SPRITE_ACTIVE | Q.SPRITE_ENEMY);
    this._dtl = this.p.x;
  },
  step: function(dt) {
    this.p.x += this.p.vx * dt;

    if(this.p.x > this._dtl + 400) {
      this.destroy();
    }
  }
});

Q.Sprite.extend("Player",{
  init: function(p) {
    this._super(p,
      { sheet: "player", type: (Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE | Q.SPRITE_FRIENDLY),
        x: 210, y: 190, vx: 0, vy: 0
      }
    );
    this.add('2d, drtControls');
    this._vel = 0;
    this.p.collisionMask = (Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE | Q.SPRITE_ENEMY);

    this.on("hit.sprite",function(collision) {
      console.log(collision);
      if(collision.obj.isA("Goal")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });
    this.on("step", function() {
      if(Q.inputs.fire) {
        this.fireWeapon();
      }
      //if(Q.in
    });
  },
  step: function(dt) {
    this.p.vx += 0.15;
    this.p.x += this.p.vx * dt;
  },
  fireWeapon: function() {
    var stage = Q.stage();
    stage.insert(new Q.Pew({ x: this.p.x+40, y: this.p.y, player_vx: this.p.vx}));
  }
});

Q.Sprite.extend("Goal", {
  init: function(p) {
    this._super(p, { sheet: 'goal' });
  }
});

Q.Sprite.extend("Enemy",{
  init: function(p) {
    this._super(p, { sheet: 'enemy', type: (Q.SPRITE_ACTIVE | Q.SPRITE_ENEMY)});
    this.p.collisionMask = (Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE | Q.SPRITE_ENEMY | Q.SPRITE_FRIENDLY);
    this.add('2d, aiBounce');

    this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
      if(collision.obj.isA("Player")) {
        Q.stageScene("endGame",1, { label: "You Died" }); 
        collision.obj.destroy();
      }
      if(collision.obj.isA("Pew")) { 
        this.destroy();
        collision.obj.destroy();
      }
    });
  }
});

Q.scene("level1",function(stage) {
  var tiles = new Q.TileLayer({ dataAsset: 'game_level.json', sheet: 'tiles' });
  stage.collisionLayer(tiles);

  // Hacky!
  var goal_width = 30;
  var goal_height = 30;
  var goal_line_x = tiles.p.w - ((goal_width / 2)+goal_width);
  var line_y = (goal_height / 2) + goal_height;
  for(var c=0; c < 25; c ++) {
    stage.insert(new Q.Goal({x: goal_line_x, y:line_y}));
    line_y += goal_height;
  }

  for(var i=0; i < 50; i++) {
    stage.insert(new Q.Enemy({ x: 600+i+95, y: 100+i+90, vx: 200*Math.random()}));
  }

  for(i=0; i < 50; i++) {
    stage.insert(new Q.Enemy({ x: 1200+i+95, y: 500+i+90, vx: 1000*Math.random()}));
  }
  var player = stage.insert(new Q.Player());

  stage.add("viewport").follow(player, {x: true, y: false});
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

Q.load("game_sprites.png, sprites.json, game_level.json, tiles.png", function() {
  Q.sheet("tiles","tiles.png", { tilew: 32, tileh: 32 });
  Q.compileSheets("game_sprites.png","sprites.json");
  Q.stageScene("level1");
  console.log('loaded!');
});

