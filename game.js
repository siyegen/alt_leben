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
    kyle_speed: 300,
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
      p.vx = p.kyle_speed;
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
      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });
    //Q.input.on("fire", this, "fireWeapon");
    this.on("step", function() {
      if(Q.inputs.fire) {
        this.trigger("fireWeapon", "");
        this.fireWeapon();
      }
    });
  },
  step: function(dt) {
    //console.log(this.p.vx);
    this.p.vx += 0.15;
    this.p.x += this.p.vx * dt;
  },
  fireWeapon: function() {
    var stage = Q.stage();
    console.log('pew');
    stage.insert(new Q.Pew({ x: this.p.x+40, y: this.p.y, player_vx: this.p.vx}));
  }
});

Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
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
  stage.collisionLayer(new Q.TileLayer({ dataAsset: 'kyle_level.json', sheet: 'tiles' }));

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

Q.load("kyle_sprites.png, sprites.json, kyle_level.json, tiles.png", function() {
  Q.sheet("tiles","tiles.png", { tilew: 32, tileh: 32 });
  Q.compileSheets("kyle_sprites.png","sprites.json");
  Q.stageScene("level1");
  console.log('loaded!');
});

