// Particle simulation with attraction/repulsion and toroidal wrapping
let particles = [];

let inertia = 0.5;
let forceConstant = 400;
let attractionMode = -1; // -1: opposites attract, +1: same attract
let minDistanceFactor = 5;
let roundingPrecision = 1e7;
let useLinearDecay = 1;
let animationId = null;
const amount=441;

let centerOffsetX = 0;
let centerOffsetY = 0;

let canvas;
let ctx;

// Initialize the grid of particles
function initializeParticles() {
	const grid = [];
	let x = 0;
	let y = 0;

	for (let i = 0; i < amount; i++) {
		const charge = (i % 2 === 0) ? +1 : -1;
		grid.push([(x + 3) * 30, (y + 3) * 30, 0, 0, charge]);

		x++;
		if (x >= 21) {
			x = 0;
			y++;
		}
	}

	return grid;
}

// Start animation
function startSimulation() {
	if (animationId) return; // Already running
	animate();
}

// Stop animation
function stopSimulation() {
	if (animationId) cancelAnimationFrame(animationId);
	animationId = null;
}

function drawParticlesOnce() {
	const W = ctx.canvas.width;
	const H = ctx.canvas.height;

	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, W, H);

	for (const p of particles) {
		ctx.fillStyle = p[4] === 1 ? '#0f0' : '#f00';
		ctx.fillRect(p[0], p[1], 5, 5);
	}
}

// Initialize canvas and particles
function init() {
	canvas = document.getElementById('myCanvas');
	ctx = canvas.getContext('2d');

	canvas.width = 800;
	canvas.height = 800;

	// Read controls only once for initialization
	centerOffsetX = parseFloat(document.getElementById("cx").value);
	centerOffsetY = parseFloat(document.getElementById("cy").value);

	particles = initializeParticles();
	
	if (document.getElementById("sd").checked) {
		for (const p of particles) {
			p[0] += centerOffsetX - Math.random() * 2 * centerOffsetX;
			p[1] += centerOffsetY - Math.random() * 2 * centerOffsetY;
		}
	} else {
		particles[220][0] += centerOffsetX;
		particles[220][1] += centerOffsetY;
	}
	
	drawParticlesOnce();
}

// Animation loop
function animate() {
	// Read controls dynamically every frame
	attractionMode = document.getElementById("polar").checked ? -1 : +1;
	forceConstant = parseFloat(document.getElementById("k").value);
	minDistanceFactor = parseFloat(document.getElementById("kk").value);
	inertia = parseFloat(document.getElementById("inert").value);
	roundingPrecision = parseFloat(document.getElementById("symmetry").value);
	useLinearDecay = document.getElementById("linearDecay").checked;

	const W = ctx.canvas.width;
	const H = ctx.canvas.height;

	// Clear canvas
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, W, H);

	// Draw particles
	for (const p of particles) {
		ctx.fillStyle = p[4] === 1 ? '#0f0' : '#f00';
		ctx.fillRect(p[0], p[1], 5, 5);
	}

	// Compute forces with symmetry
	const netForces = particles.map(() => [0, 0]);

	for (let i = 0; i < particles.length; i++) {
		const [x0, y0, , , q0] = particles[i];
		for (let j = i + 1; j < particles.length; j++) {
			const [x1, y1, , , q1] = particles[j];

			/*
			// Toroidal wrapping
			let dx = x1 - x0;
			let dy = y1 - y0;
			dx = ((dx + W / 2) % W) - W / 2;
			dy = ((dy + H / 2) % H) - H / 2;
			// % isn't mod
			*/
			
			
			let dx = (x1 - x0 + W) % W;
			if (dx > W / 2) dx -= W;

			let dy = (y1 - y0 + H) % H;
			if (dy > H / 2) dy -= H;
			

			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance === 0) continue;

			let decayDenominator;
			if (useLinearDecay) {
				decayDenominator = distance * distance; // 1/r decay
			} else {
				decayDenominator = distance * distance * distance; // Coulomb-like decay
			}
			if (decayDenominator <= forceConstant * minDistanceFactor) continue;

			const factor = q0 * q1 * attractionMode * forceConstant / decayDenominator;
			const fx = Math.round(dx * factor * roundingPrecision) / roundingPrecision;
			const fy = Math.round(dy * factor * roundingPrecision) / roundingPrecision;

			// Symmetric application
			netForces[i][0] += fx;
			netForces[i][1] += fy;
			netForces[j][0] -= fx;
			netForces[j][1] -= fy;
		}
	}

	// Update positions
	for (let i = 0; i < particles.length; i++) {
		
		const p = particles[i];
		const [fx, fy] = netForces[i];
		p[0] += fx + p[2] * inertia;
		p[1] += fy + p[3] * inertia;
		p[2] = fx;
		p[3] = fy;

		// Wrap positions toroidally
		p[0] = (p[0] + W) % W;
		p[1] = (p[1] + H) % H;
	}

	animationId = requestAnimationFrame(animate);
}

window.onload = function() {
	init();
};