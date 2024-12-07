import { Scene } from "phaser";

const bucketTopY = 460;
const wallHeight = 280;
const slotWidth = 30;

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  msg_text: Phaser.GameObjects.Text;
  balls: Set<Phaser.Physics.Matter.Image>;
  pinsCategory = 0;
  ballsCategory = 0;
  bucketCategory = 0;
  bucket: Phaser.GameObjects.Rectangle;
  ballsText: Phaser.GameObjects.Text;
  lastBallTime: number = 0;

  constructor() {
    super("Game");
  }
  preload() {
    this.load.image("ball", "assets/ball1.png");
  }
  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x000000);

    // this.background = this.add.image(512, 384, "background");
    // this.background.setAlpha(0.5);

    // this.msg_text = this.add.text(
    //   512,
    //   384,
    //   "Make something fun!\nand share it with us:\nsupport@phaser.io",
    //   {
    //     fontFamily: "Arial Black",
    //     fontSize: 38,
    //     color: "#ffffff",
    //     stroke: "#000000",
    //     strokeThickness: 8,
    //     align: "center",
    //   }
    // );
    // this.msg_text.setOrigin(0.5);

    this.input.once("pointerdown", () => {
      // this.scene.start("GameOver");
      this.scene.start("Game");
    });

    this.matter.world.setBounds(0, 0, 800, 600, 32, true, true, false, false);

    //  Create our Collision categories. One for the pins, one for the balls and one for the bucket

    this.pinsCategory = this.matter.world.nextCategory();
    this.ballsCategory = this.matter.world.nextCategory();
    this.bucketCategory = this.matter.world.nextCategory();

    //  Create a basic pachinko board layout

    let startY = 150;

    for (let y = 0; y < 8; y++) {
      let startX = 50;
      let max = 23;

      if (y % 2 === 0) {
        startX = 50 + 16;
        max = 22;
      }

      // generate array of pins
      for (let x = 0; x < max; x++) {
        const radius = 3;
        const pin = this.matter.add.image(startX + x * 32, startY + y, "ball");
        pin.setDisplaySize(radius * 2, radius * 2);
        pin.setCircle(radius);
        pin.setStatic(true);
        pin.setBounce(1);
        pin.setCollisionCategory(this.pinsCategory);
        pin.setCollisionGroup(this.ballsCategory);
        // const body = pin.body as MatterJS.Body;
        // body.collisionFilter.category = this.pinsCategory;
        // body.collisionFilter.mask = this.ballsCategory;
      }

      startY += 38;
    }

    //  Our bucket to collect the balls in
    // this.bucket = this.add.rectangle(200, 550, 200, 32, 0xffffff);
    // this.matter.add.gameObject(this.bucket, { isStatic: true, isSensor: true });
    // this.bucket.setCollisionCategory(this.bucketCategory);
    // this.bucket.setCollidesWith([this.ballsCategory]);

    //  Use a tween to move the bucket in a set path
    // this.tweens.add({
    //   targets: this.bucket,
    //   x: 600,
    //   duration: 6000,
    //   yoyo: true,
    //   repeat: -1,
    //   ease: "linear",
    // });

    const floorWidth = this.cameras.main.width;
    const floor = this.add.rectangle(
      floorWidth / 2,
      bucketTopY + wallHeight,
      floorWidth,
      10,
      0xffffff
    );
    this.matter.add.gameObject(floor, {
      isStatic: true,
      //   restitution: 0,
      collisionFilter: {
        category: this.ballsCategory,
        //   mask: this.pinsCategory,
      },
      collidesWith: [this.ballsCategory],
    });

    const wallCount = floorWidth / slotWidth;
    for (let i = 0; i < wallCount; i++) {
      const wall = this.add.rectangle(
        5 + i * (slotWidth + 2),
        bucketTopY + wallHeight / 2,
        10,
        wallHeight,
        0xffffff
      );
      this.matter.add.gameObject(wall, {
        isStatic: true,
        //   restitution: 0,
        collisionFilter: {
          category: this.ballsCategory,
          //   mask: this.pinsCategory,
        },
        collidesWith: [this.ballsCategory],
      });
    }

    // console.log(body);
    // console.log(floor);
    // console.log(floor.body);
    // const body = floor.body as MatterJS.Body;
    // body.collisionFilter.categroy = this.ballsCategory;

    //  Our 'dropper' that will drop balls from the top (technically this doesn't have to be a physics object, but it helps for debugging)
    // const dropper = this.matter.add.rectangle(400, 50, 96, 32, {
    //   isStatic: true,
    // });

    //  A basic score
    let score = 0;

    const scoreText = this.add.text(10, 10, "Score: 0", {
      font: "16px Courier",
      fill: "#00ff00",
    });

    //  The balls we can drop from the top

    this.balls = new Set();

    this.ballsText = this.add.text(690, 10, "Balls: 100", {
      font: "16px Courier",
      fill: "#00ff00",
    });

    //  A function that creates a ball

    // this.input.on("pointermove", (pointer) => {
    //   this.matter.body.setPosition(dropper, {
    //     x: pointer.worldX,
    //     y: dropper.position.y,
    //   });
    // });

    this.input.on("pointerdown", (pointer) => {
      //   this.createBall(dropper.position.x, dropper.position.y);
      this.createBall(pointer.worldX, pointer.worldY);
    });
  }

  update(time: number, delta: number) {
    const maxBalls = 200;
    const msPerBall = 50;
    if (this.balls.size < maxBalls && this.lastBallTime + msPerBall < time) {
      this.lastBallTime = time;
      this.createBall(400, 100);
    }

    //  If a ball goes below the screen, remove it
    this.balls.forEach((ball) => {
      if (ball.y > bucketTopY) {
        ball.setBounce(0);
      }
      if (ball.y > 850) {
        this.balls.delete(ball);

        ball.destroy();
      }
    });
  }

  createBall(x: number, y: number) {
    const ball = this.matter.add.image(x, y, "ball");
    // this.matter.add.rectangle(x, y, 10, 10, {});
    const radius = 10;
    ball.setDisplaySize(radius * 2, radius * 2);
    ball.setCircle(radius);
    ball.setFriction(0.005);
    ball.setBounce(0.5);
    ball.setCollisionCategory(this.ballsCategory);
    ball.setCollidesWith([
      this.ballsCategory,
      this.pinsCategory,
      this.bucketCategory,
    ]);

    // this.bucket.setOnCollideWith(ball.body, (body, collisionData) => {
    //   this.balls.delete(ball);

    //   ball.destroy();

    //   //   score += 100;

    //   //   scoreText.setText("Score: " + score);
    // });

    this.balls.add(ball);

    this.ballsText.setText("Balls: " + (100 - this.balls.size));
  }
}
