import Matter from 'matter-js';
import type { ActiveFruit, FruitSpec } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Create the Matter.js engine
export const createEngine = () => {
  return Matter.Engine.create({
    gravity: { x: 0, y: 2.5, scale: 0.002 }, // Increased gravity for faster fall
    enableSleeping: true, // Enable sleeping for better performance
  });
};

// Create the Matter.js world (usually via engine.world)
export const getWorld = (engine: Matter.Engine) => {
  return engine.world;
};

// Create a Matter.js runner
export const createRunner = () => {
  return Matter.Runner.create();
};

// Start the Matter.js runner with the engine
export const startRunner = (runner: Matter.Runner, engine: Matter.Engine) => {
  Matter.Runner.run(runner, engine);
  return runner;
};

// Create a Matter.js renderer (for debugging purposes)
export const createRenderer = (element: HTMLElement, engine: Matter.Engine, width: number, height: number) => {
  return Matter.Render.create({
    element,
    engine,
    options: {
      width,
      height,
      wireframes: false,
      background: 'transparent',
    },
  });
};

// Create container walls
export const createContainerWalls = (
  world: Matter.World,
  width: number,
  height: number,
  wallThickness: number = 50
) => {
  // Ground
  const ground = Matter.Bodies.rectangle(
    width / 2,
    height + wallThickness / 2,
    width,
    wallThickness,
    { isStatic: true, restitution: 0.2, friction: 0.5, label: 'ground' }
  );

  // Left wall
  const leftWall = Matter.Bodies.rectangle(
    -wallThickness / 2,
    height / 2,
    wallThickness,
    height * 2,
    { isStatic: true, restitution: 0.2, friction: 0.5, label: 'leftWall' }
  );

  // Right wall
  const rightWall = Matter.Bodies.rectangle(
    width + wallThickness / 2,
    height / 2,
    wallThickness,
    height * 2,
    { isStatic: true, restitution: 0.2, friction: 0.5, label: 'rightWall' }
  );

  // Add all bodies to the world
  Matter.Composite.add(world, [ground, leftWall, rightWall]);

  return { ground, leftWall, rightWall };
};

// Create overflow sensor near the top of the container
export const createOverflowSensor = (world: Matter.World, width: number, overflowY: number) => {
  const sensor = Matter.Bodies.rectangle(width / 2, overflowY, width, 10, {
    isStatic: true,
    isSensor: true, // Non-colliding sensor
    label: 'overflowSensor',
    render: { opacity: 0.1 }, // Nearly invisible
  });

  Matter.Composite.add(world, sensor);
  return sensor;
};

// Create a fruit body
export const createFruitBody = (
  world: Matter.World,
  fruitSpec: FruitSpec,
  x: number,
  y: number
): ActiveFruit => {
  const id = uuidv4();
  const body = Matter.Bodies.circle(x, y, fruitSpec.radius, {
    restitution: 0.3,
    friction: 0.1,
    frictionAir: 0.001,
    frictionStatic: 0.1,
    density: 0.0005, // Lower density makes the physics feel smoother
    label: `fruit-${id}`,
  });

  // Store the fruit data in the body for collision detection
  (body as any).fruitData = {
    id,
    fruitId: fruitSpec.id,
    radius: fruitSpec.radius,
    name: fruitSpec.name
  };

  // Add the body to the world
  Matter.Composite.add(world, body);

  return {
    id,
    fruitId: fruitSpec.id,
    x,
    y,
    radius: fruitSpec.radius,
    color: fruitSpec.color,
    matterBodyId: body.id,
  };
};

// Remove a fruit body from the world
export const removeFruitBody = (world: Matter.World, matterBodyId: number) => {
  const bodies = Matter.Composite.allBodies(world);
  const body = bodies.find(b => b.id === matterBodyId);
  if (body) {
    Matter.Composite.remove(world, body);
  }
};

// Update an ActiveFruit with current position from Matter.js
export const updateFruitPosition = (
  activeFruit: ActiveFruit,
  world: Matter.World
): ActiveFruit | null => {
  const body = Matter.Composite.get(world, activeFruit.matterBodyId, 'body') as Matter.Body;
  if (!body) return null;

  return {
    ...activeFruit,
    x: body.position.x,
    y: body.position.y,
  };
};

// Check if a body is relatively static (not moving much)
export const isBodyAtRest = (body: Matter.Body, threshold: number = 0.1): boolean => {
  const velocity = body.velocity;
  const angularVelocity = body.angularVelocity;

  return (
    Math.abs(velocity.x) < threshold &&
    Math.abs(velocity.y) < threshold &&
    Math.abs(angularVelocity) < threshold * 0.1
  );
};

// Clean up Matter.js resources
export const cleanupMatter = (engine: Matter.Engine, runner: Matter.Runner, render?: Matter.Render) => {
  Matter.Runner.stop(runner);
  if (render) Matter.Render.stop(render);
  Matter.Engine.clear(engine);
};
