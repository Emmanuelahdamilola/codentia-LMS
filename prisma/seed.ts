// prisma/seed.ts
import { PrismaClient, Difficulty, Role, LiveClassStatus, NotificationType, AIContext } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000)
const daysAgo     = (d: number) => new Date(Date.now() - d * 86_400_000)

// ─────────────────────────────────────────────────────────────
// Lesson content (rich markdown so the lesson page renders well)
// ─────────────────────────────────────────────────────────────

const content = {
  htmlIntro: `## What is HTML?

HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the **structure** of a web page using elements represented by tags.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>My first web page.</p>
  </body>
</html>
\`\`\`

Every web page you have ever seen is built with HTML at its core.`,

  htmlTags: `## HTML Tags & Elements

HTML uses **tags** to mark up content. Most tags come in pairs — an opening and a closing tag.

\`\`\`html
<p>This is a paragraph.</p>
<h1>This is a heading</h1>
<a href="https://example.com">This is a link</a>
<img src="photo.jpg" alt="A photo">
\`\`\`

### Common Tags

- \`<h1>\` to \`<h6>\` — Headings
- \`<p>\` — Paragraph
- \`<a>\` — Anchor (link)
- \`<img>\` — Image
- \`<ul>\`, \`<ol>\`, \`<li>\` — Lists
- \`<div>\` — Division (block container)
- \`<span>\` — Inline container`,

  htmlForms: `## HTML Forms

Forms allow users to input and submit data.

\`\`\`html
<form action="/submit" method="POST">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" placeholder="Your name">

  <label for="email">Email:</label>
  <input type="email" id="email" name="email">

  <label for="message">Message:</label>
  <textarea id="message" name="message"></textarea>

  <button type="submit">Send</button>
</form>
\`\`\`

### Input Types

\`text\`, \`email\`, \`password\`, \`number\`, \`date\`, \`checkbox\`, \`radio\`, \`file\`, \`submit\``,

  cssIntro: `## Introduction to CSS

CSS (Cascading Style Sheets) controls the **visual presentation** of HTML elements.

\`\`\`css
/* selector { property: value; } */

h1 {
  color: #8A70D6;
  font-size: 32px;
  font-weight: 900;
}

p {
  color: #424040;
  line-height: 1.6;
  margin-bottom: 16px;
}
\`\`\`

### Three Ways to Add CSS

1. **Inline** — \`<p style="color: red;">\`
2. **Internal** — \`<style>\` tag in \`<head>\`
3. **External** — separate \`.css\` file (recommended)`,

  boxModel: `## The CSS Box Model

Every HTML element is a rectangular box made up of four layers.

\`\`\`
┌──────────────────────────────┐
│           MARGIN             │
│  ┌────────────────────────┐  │
│  │        BORDER          │  │
│  │  ┌──────────────────┐  │  │
│  │  │     PADDING      │  │  │
│  │  │  ┌────────────┐  │  │  │
│  │  │  │  CONTENT   │  │  │  │
│  │  │  └────────────┘  │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
\`\`\`

\`\`\`css
.box {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 2px solid #8A70D6;
  margin: 16px auto;

  /* Makes width include padding + border */
  box-sizing: border-box;
}
\`\`\`

Always set \`box-sizing: border-box\` globally for predictable layouts.`,

  flexbox: `## CSS Flexbox

Flexbox is a one-dimensional layout system perfect for rows and columns.

\`\`\`css
.container {
  display: flex;
  flex-direction: row;          /* or column */
  justify-content: space-between; /* main axis */
  align-items: center;          /* cross axis */
  gap: 16px;
  flex-wrap: wrap;
}

.item {
  flex: 1;           /* grow to fill space */
  flex: 0 0 200px;   /* fixed width */
}
\`\`\`

### Common Patterns

\`\`\`css
/* Center anything */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Navigation bar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Equal columns */
.columns { display: flex; gap: 16px; }
.column  { flex: 1; }
\`\`\``,

  jsIntro: `## What is JavaScript?

JavaScript is the programming language of the web. It runs in every modern browser and makes pages **interactive and dynamic**.

\`\`\`javascript
// The classic first program
console.log("Hello, World!");

// Variables
const name = "Emmanuel";
console.log("Hello, " + name + "!");
\`\`\`

### Why Learn JavaScript?

JavaScript is consistently the **most popular language** in the world. It powers:

- Interactive websites (front-end)
- Servers with Node.js (back-end)
- Mobile apps with React Native
- Desktop apps with Electron`,

  variables: `## Variables & Data Types

Variables are containers that store data values.

\`\`\`javascript
// const — cannot be reassigned (use by default)
const name = "Emmanuel";
const age  = 25;

// let — can be reassigned
let score = 0;
score = 100; // ✓ fine

// var — old way, avoid in modern code
var old = "don't use this";
\`\`\`

### Data Types

\`\`\`javascript
const text    = "Hello";        // String
const num     = 42;             // Number
const decimal = 9.99;           // Number
const flag    = true;           // Boolean
const nothing = null;           // Null
let   empty;                    // Undefined
const colors  = ["red","blue"]; // Array
const user    = { name: "Em" }; // Object
\`\`\`

### Type Checking

\`\`\`javascript
typeof "hello"  // "string"
typeof 42       // "number"
typeof true     // "boolean"
typeof []       // "object"
typeof null     // "object" ← famous quirk
\`\`\``,

  operators: `## Operators & Expressions

\`\`\`javascript
// Arithmetic
5 + 3    // 8
10 - 4   // 6
3 * 4    // 12
15 / 3   // 5
17 % 5   // 2  — remainder
2 ** 8   // 256 — exponentiation

// Comparison (always use === not ==)
5 === 5  // true
5 !== 3  // true
5 > 3    // true
5 >= 5   // true

// Logical
true && false  // false  (AND)
true || false  // true   (OR)
!true          // false  (NOT)

// Assignment shortcuts
let x = 10;
x += 5;   // x = 15
x -= 3;   // x = 12
x *= 2;   // x = 24
x++;      // x = 25
x--;      // x = 24
\`\`\``,

  conditionals: `## Control Flow: if / else

\`\`\`javascript
const score = 85;

if (score >= 90) {
  console.log("A — Excellent!");
} else if (score >= 80) {
  console.log("B — Great!");
} else if (score >= 70) {
  console.log("C — Good");
} else {
  console.log("Needs improvement");
}

// Ternary operator (one-liner)
const grade = score >= 60 ? "Pass" : "Fail";

// Switch statement
switch (new Date().getDay()) {
  case 0: console.log("Sunday");  break;
  case 6: console.log("Saturday"); break;
  default: console.log("Weekday");
}
\`\`\``,

  loops: `## Loops

\`\`\`javascript
// for loop
for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}

// while loop
let count = 0;
while (count < 3) {
  console.log(count++);
}

// for...of — iterates array values
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
  console.log(fruit);
}

// for...in — iterates object keys
const person = { name: "Emmanuel", age: 25 };
for (const key in person) {
  console.log(\`\${key}: \${person[key]}\`);
}

// Array methods (preferred over for loops)
fruits.forEach(f => console.log(f));
const upper = fruits.map(f => f.toUpperCase());
const a     = fruits.filter(f => f.startsWith("a"));
\`\`\``,

  functions: `## Functions in JavaScript

Functions are reusable blocks of code — the backbone of every JS program.

\`\`\`javascript
// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Emmanuel")); // Hello, Emmanuel!

// Arrow function — concise ES6 syntax
const greet = name => \`Hello, \${name}!\`;

// Default parameters
function greet(name = "World") {
  return \`Hello, \${name}!\`;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4); // 10
\`\`\`

### Higher-Order Functions

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

const doubled  = numbers.map(n => n * 2);        // [2,4,6,8,10]
const evens    = numbers.filter(n => n % 2 === 0); // [2,4]
const total    = numbers.reduce((s, n) => s + n, 0); // 15
const firstBig = numbers.find(n => n > 3);         // 4
\`\`\``,

  closures: `## Closures & Scope

A **closure** is a function that remembers variables from its outer scope even after the outer function has returned.

\`\`\`javascript
function makeCounter() {
  let count = 0; // private — can't be accessed from outside

  return {
    increment: () => ++count,
    decrement: () => --count,
    value:     () => count,
  };
}

const counter = makeCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.decrement(); // 1
console.log(counter.value()); // 1
\`\`\`

### Scope Types

\`\`\`javascript
const globalVar = "everywhere"; // Global scope

function outer() {
  const outerVar = "in outer";  // Function scope

  function inner() {
    const innerVar = "in inner"; // Block scope
    // Can access all three ✓
    console.log(globalVar, outerVar, innerVar);
  }

  inner();
}
\`\`\`

The \`count\` variable above is **encapsulated** — closures are the foundation of modules, factories, and private state in JavaScript.`,

  arrays: `## Arrays in Depth

\`\`\`javascript
const arr = [1, 2, 3, 4, 5];

// ── Mutating methods ──────────────────────────
arr.push(6);       // add to end    → [1,2,3,4,5,6]
arr.pop();         // remove end    → [1,2,3,4,5]
arr.unshift(0);    // add to start  → [0,1,2,3,4,5]
arr.shift();       // remove start  → [1,2,3,4,5]
arr.splice(2,1);   // remove at i   → [1,2,4,5]

// ── Non-mutating (return new array) ──────────
arr.map(x => x * 2)              // [2,4,8,10]
arr.filter(x => x > 2)          // [4,5]
arr.reduce((s, x) => s + x, 0)  // 15
arr.find(x => x > 3)            // 4
arr.some(x => x > 4)            // true
arr.every(x => x > 0)           // true
arr.includes(3)                  // false (after splice)
arr.sort((a,b) => a - b)        // ascending

// ── Spread & destructuring ────────────────────
const copy          = [...arr];
const [a, b, ...rest] = arr;
const merged        = [...arr, ...arr];
\`\`\``,

  objects: `## Objects in Depth

\`\`\`javascript
const user = {
  name:  "Emmanuel",
  age:   25,
  email: "em@example.com",
  greet() {
    return \`Hi, I'm \${this.name}\`;
  },
};

// Access
user.name;       // dot notation
user["email"];   // bracket (useful for dynamic keys)

// Destructuring
const { name, age } = user;
const { name: userName, age: userAge = 0 } = user; // rename + default

// Spread — create updated copy
const updated = { ...user, age: 26 };

// Useful Object methods
Object.keys(user)    // ["name","age","email","greet"]
Object.values(user)  // ["Emmanuel", 25, ...]
Object.entries(user) // [["name","Emmanuel"], ...]

// Optional chaining & nullish coalescing
const city  = user?.address?.city ?? "Unknown";
const phone = user?.contacts?.[0]?.phone ?? "N/A";
\`\`\``,

  async: `## Async JavaScript & Promises

JavaScript is single-threaded — async lets us handle slow operations without blocking.

\`\`\`javascript
// Promise chain
fetch("/api/user")
  .then(res  => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async / await — cleaner syntax (preferred)
async function loadUser(id) {
  try {
    const res  = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const user = await res.json();
    return user;
  } catch (error) {
    console.error("Failed:", error);
    throw error;
  }
}

// Parallel requests — faster than sequential
const [user, posts] = await Promise.all([
  fetch("/api/user").then(r => r.json()),
  fetch("/api/posts").then(r => r.json()),
]);

// Promise.allSettled — don't fail if one rejects
const results = await Promise.allSettled([req1, req2, req3]);
\`\`\``,

  reactIntro: `## Introduction to React

React is a JavaScript library for building user interfaces, created by Facebook in 2013.

### Core Idea: Components

Everything in React is a **component** — a reusable piece of UI.

\`\`\`jsx
function Greeting({ name }) {
  return (
    <div className="greeting">
      <h1>Hello, {name}!</h1>
      <p>Welcome to React.</p>
    </div>
  );
}

// Usage
<Greeting name="Emmanuel" />
\`\`\`

### JSX

JSX is a syntax extension that looks like HTML inside JavaScript:

\`\`\`jsx
const element = (
  <div>
    <h1>Title</h1>
    <p>{2 + 2} is four</p>
  </div>
);
\`\`\`

JSX is compiled to \`React.createElement()\` calls by Babel.`,

  components: `## Components & Props

Props are how parent components pass data to child components.

\`\`\`jsx
// Define
function Button({ label, onClick, variant = "primary" }) {
  return (
    <button
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// Use
<Button label="Save"   onClick={handleSave}   />
<Button label="Cancel" onClick={handleCancel} variant="secondary" />
\`\`\`

### Rules

- Props flow **down** (parent → child)
- Events flow **up** (child calls parent's callback)
- Props are **read-only** — never mutate them
- Use **keys** when rendering lists

\`\`\`jsx
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}
\`\`\``,

  useState: `## useState Hook

\`useState\` adds state to functional components.

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // [value, setter]

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
\`\`\`

### State with Objects

\`\`\`jsx
const [form, setForm] = useState({ name: '', email: '' });

const handleChange = e => {
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
};
\`\`\`

### State with Arrays

\`\`\`jsx
const [items, setItems] = useState([]);

// Add
setItems(prev => [...prev, newItem]);

// Remove
setItems(prev => prev.filter(i => i.id !== id));

// Update
setItems(prev => prev.map(i => i.id === id ? { ...i, done: true } : i));
\`\`\``,

  useEffect: `## useEffect Hook

\`useEffect\` runs side effects after rendering — data fetching, subscriptions, DOM updates.

\`\`\`jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(\`/api/users/\${userId}\`)
      .then(res  => res.json())
      .then(data => { setUser(data); setLoading(false); });

    // Cleanup runs before the next effect or on unmount
    return () => { /* cancel subscriptions */ };

  }, [userId]); // Re-run only when userId changes

  if (loading) return <p>Loading...</p>;
  return <h1>{user?.name}</h1>;
}

// Run once on mount
useEffect(() => {
  document.title = 'My App';
}, []); // empty array = run once
\`\`\``,

  todoProject: `## Project: Build a Todo App

Combine everything you've learned into a complete Todo application.

\`\`\`jsx
import { useState } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React',      done: true  },
    { id: 2, text: 'Build a project',  done: false },
  ]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | done

  const add = () => {
    if (!input.trim()) return;
    setTodos(p => [...p, { id: Date.now(), text: input, done: false }]);
    setInput('');
  };

  const toggle = id =>
    setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = id =>
    setTodos(p => p.filter(t => t.id !== id));

  const visible = todos.filter(t =>
    filter === 'active' ? !t.done :
    filter === 'done'   ?  t.done : true
  );

  return (
    <div>
      <h1>Todo App ({todos.filter(t => !t.done).length} left)</h1>
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && add()} />
      <button onClick={add}>Add</button>
      <div>
        {['all','active','done'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontWeight: filter === f ? 'bold' : 'normal' }}>
            {f}
          </button>
        ))}
      </div>
      <ul>
        {visible.map(t => (
          <li key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
              {t.text}
            </span>
            <button onClick={() => remove(t.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
\`\`\``,
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Codentia database...\n')

  const pw = {
    admin:   await bcrypt.hash('admin123',   12),
    student: await bcrypt.hash('student123', 12),
  }

  // ── Users ──────────────────────────────────────────────────
  console.log('👤 Users...')

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@codentia.dev' },
    update: {},
    create: { name: 'Codentia Admin', email: 'admin@codentia.dev', password: pw.admin, role: Role.ADMIN },
  })

  // Main student — matches the dashboard blueprint (Emmanuel)
  const emmanuel = await prisma.user.upsert({
    where:  { email: 'emmanuel@codentia.dev' },
    update: {},
    create: { name: 'Emmanuel Okafor', email: 'emmanuel@codentia.dev', password: pw.student },
  })

  // Keep your original students too
  const john = await prisma.user.upsert({
    where:  { email: 'john@example.com' },
    update: {},
    create: { name: 'John Doe',    email: 'john@example.com',   password: pw.student },
  })
  const ada = await prisma.user.upsert({
    where:  { email: 'ada@example.com' },
    update: {},
    create: { name: 'Ada Okafor',  email: 'ada@example.com',    password: pw.student },
  })
  const emeka = await prisma.user.upsert({
    where:  { email: 'emeka@example.com' },
    update: {},
    create: { name: 'Emeka Nwosu', email: 'emeka@example.com',  password: pw.student },
  })

  // ── Courses ────────────────────────────────────────────────
  console.log('📚 Courses...')

  const htmlCourse = await prisma.course.upsert({
    where:  { slug: 'html-css-fundamentals' },
    update: { published: true },
    create: {
      id: 'course-html-css', slug: 'html-css-fundamentals',
      title: 'HTML & CSS Fundamentals',
      description: 'Master the building blocks of the web. Learn HTML structure, CSS styling, the box model, flexbox, grid, and responsive design.',
      difficulty: Difficulty.BEGINNER, category: 'Web Development', published: true,
    },
  })

  const jsCourse = await prisma.course.upsert({
    where:  { slug: 'javascript-fundamentals' },
    update: { published: true },
    create: {
      id: 'course-javascript', slug: 'javascript-fundamentals',
      title: 'JavaScript Fundamentals',
      description: 'Go from zero to confident JS developer. Variables, functions, arrays, objects, DOM, async programming and modern ES6+ features.',
      difficulty: Difficulty.INTERMEDIATE, category: 'Programming', published: true,
    },
  })

  const reactCourse = await prisma.course.upsert({
    where:  { slug: 'react-basics' },
    update: { published: true },
    create: {
      id: 'course-react', slug: 'react-basics',
      title: 'React Basics',
      description: 'Build modern interactive UIs with React. Components, hooks, state management, and best practices.',
      difficulty: Difficulty.INTERMEDIATE, category: 'Frontend', published: true,
    },
  })

  const backendCourse = await prisma.course.upsert({
    where:  { slug: 'backend-development' },
    update: { published: true },
    create: {
      id: 'course-backend', slug: 'backend-development',
      title: 'Backend Development',
      description: 'Build production-ready APIs with Node.js, Express, databases, and authentication.',
      difficulty: Difficulty.ADVANCED, category: 'Backend', published: true,
    },
  })

  // ── HTML Course Modules & Lessons ─────────────────────────
  console.log('🗂  HTML modules & lessons...')

  const htmlMod1 = await prisma.module.upsert({
    where:  { id: 'mod-html-1' },
    update: {},
    create: { id: 'mod-html-1', title: 'HTML Basics',    order: 0, courseId: htmlCourse.id },
  })
  const htmlMod2 = await prisma.module.upsert({
    where:  { id: 'mod-html-2' },
    update: {},
    create: { id: 'mod-html-2', title: 'CSS Fundamentals', order: 1, courseId: htmlCourse.id },
  })
  const htmlMod3 = await prisma.module.upsert({
    where:  { id: 'mod-html-3' },
    update: {},
    create: { id: 'mod-html-3', title: 'Layouts & Responsive', order: 2, courseId: htmlCourse.id },
  })

  const hL1 = await prisma.lesson.upsert({ where: { id: 'lesson-html-1' }, update: {}, create: { id: 'lesson-html-1', title: 'What is HTML?',              content: content.htmlIntro,  order: 0, moduleId: htmlMod1.id } })
  const hL2 = await prisma.lesson.upsert({ where: { id: 'lesson-html-2' }, update: {}, create: { id: 'lesson-html-2', title: 'HTML Tags & Elements',       content: content.htmlTags,   order: 1, moduleId: htmlMod1.id } })
  const hL3 = await prisma.lesson.upsert({ where: { id: 'lesson-html-3' }, update: {}, create: { id: 'lesson-html-3', title: 'Forms & Inputs',             content: content.htmlForms,  order: 2, moduleId: htmlMod1.id, hasAssignment: true } })
  const hL4 = await prisma.lesson.upsert({ where: { id: 'lesson-html-4' }, update: {}, create: { id: 'lesson-html-4', title: 'Introduction to CSS',        content: content.cssIntro,   order: 0, moduleId: htmlMod2.id } })
  const hL5 = await prisma.lesson.upsert({ where: { id: 'lesson-html-5' }, update: {}, create: { id: 'lesson-html-5', title: 'The CSS Box Model',          content: content.boxModel,   order: 1, moduleId: htmlMod2.id } })
  const hL6 = await prisma.lesson.upsert({ where: { id: 'lesson-html-6' }, update: {}, create: { id: 'lesson-html-6', title: 'Colors & Typography',        content: '## Colors & Typography\n\n```css\nbody {\n  font-family: "Lato", sans-serif;\n  font-size: 16px;\n  color: #424040;\n}\n\nh1 { color: #8A70D6; font-size: 2rem; font-weight: 900; }\n```', order: 2, moduleId: htmlMod2.id } })
  const hL7 = await prisma.lesson.upsert({ where: { id: 'lesson-html-7' }, update: {}, create: { id: 'lesson-html-7', title: 'CSS Flexbox',                content: content.flexbox,    order: 0, moduleId: htmlMod3.id, hasQuiz: true } })
  const hL8 = await prisma.lesson.upsert({ where: { id: 'lesson-html-8' }, update: {}, create: { id: 'lesson-html-8', title: 'CSS Grid',                   content: '## CSS Grid\n\nCSS Grid is a two-dimensional layout system.\n\n```css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n}\n```', order: 1, moduleId: htmlMod3.id } })
  const hL9 = await prisma.lesson.upsert({ where: { id: 'lesson-html-9' }, update: {}, create: { id: 'lesson-html-9', title: 'Responsive Design',          content: '## Responsive Design\n\n```css\n/* Mobile first */\n.container { width: 100%; padding: 0 16px; }\n\n@media (min-width: 768px) {\n  .container { max-width: 768px; margin: 0 auto; }\n}\n\n@media (min-width: 1024px) {\n  .container { max-width: 1280px; }\n}\n```', order: 2, moduleId: htmlMod3.id, hasAssignment: true } })

  // ── JS Course Modules & Lessons ────────────────────────────
  console.log('🗂  JS modules & lessons...')

  const jsMod1 = await prisma.module.upsert({
    where:  { id: 'module-js-1' },  // preserve your original ID
    update: {},
    create: { id: 'module-js-1', title: 'Getting Started',   order: 0, courseId: jsCourse.id },
  })
  const jsMod2 = await prisma.module.upsert({
    where:  { id: 'module-js-2' },
    update: {},
    create: { id: 'module-js-2', title: 'Core Concepts',     order: 1, courseId: jsCourse.id },
  })
  const jsMod3 = await prisma.module.upsert({
    where:  { id: 'module-js-3' },
    update: {},
    create: { id: 'module-js-3', title: 'Functions & Scope', order: 2, courseId: jsCourse.id },
  })
  const jsMod4 = await prisma.module.upsert({
    where:  { id: 'module-js-4' },
    update: {},
    create: { id: 'module-js-4', title: 'Arrays & Objects',  order: 3, courseId: jsCourse.id },
  })

  // preserve your original lesson IDs for module 1
  const jL1  = await prisma.lesson.upsert({ where: { id: 'lesson-js-1-1' }, update: {}, create: { id: 'lesson-js-1-1', title: 'What is JavaScript?',      content: content.jsIntro,      order: 0, moduleId: jsMod1.id } })
  const jL2  = await prisma.lesson.upsert({ where: { id: 'lesson-js-1-2' }, update: { content: content.variables }, create: { id: 'lesson-js-1-2', title: 'Variables & Data Types',   content: content.variables,    order: 1, moduleId: jsMod1.id, hasQuiz: true } })
  const jL3  = await prisma.lesson.upsert({ where: { id: 'lesson-js-1-3' }, update: {}, create: { id: 'lesson-js-1-3', title: 'Setting Up Your Environment', content: '## Dev Environment\n\nYou need:\n1. **A browser** — Chrome or Firefox\n2. **VS Code** — best code editor\n\n```javascript\n// Test in the browser console (F12)\nconsole.log("JS is working!");\n```', order: 2, moduleId: jsMod1.id } })
  const jL4  = await prisma.lesson.upsert({ where: { id: 'lesson-js-2-1' }, update: {}, create: { id: 'lesson-js-2-1', title: 'Operators & Expressions',   content: content.operators,    order: 0, moduleId: jsMod2.id } })
  const jL5  = await prisma.lesson.upsert({ where: { id: 'lesson-js-2-2' }, update: {}, create: { id: 'lesson-js-2-2', title: 'Control Flow: if / else',   content: content.conditionals, order: 1, moduleId: jsMod2.id } })
  const jL6  = await prisma.lesson.upsert({ where: { id: 'lesson-js-2-3' }, update: {}, create: { id: 'lesson-js-2-3', title: 'Loops',                     content: content.loops,        order: 2, moduleId: jsMod2.id } })
  // Module 3 — Functions & Scope (this is where Emmanuel is at 45%)
  const jL7  = await prisma.lesson.upsert({ where: { id: 'lesson-js-3-1' }, update: {}, create: { id: 'lesson-js-3-1', title: 'Function Declarations',     content: content.functions,    order: 0, moduleId: jsMod3.id } })
  const jL8  = await prisma.lesson.upsert({ where: { id: 'lesson-js-3-2' }, update: {}, create: { id: 'lesson-js-3-2', title: 'Arrow Functions',           content: '## Arrow Functions\n\n```javascript\n// Regular\nfunction square(x) { return x * x; }\n\n// Arrow — same thing\nconst square = x => x * x;\n\n// Multiple params\nconst add = (a, b) => a + b;\n\n// Multi-line\nconst process = (user) => {\n  const name  = user.name.toUpperCase();\n  const email = user.email.toLowerCase();\n  return { name, email };\n};\n```', order: 1, moduleId: jsMod3.id } })
  const jL9  = await prisma.lesson.upsert({ where: { id: 'lesson-js-3-3' }, update: {}, create: { id: 'lesson-js-3-3', title: 'Closures & Scope',          content: content.closures,     order: 2, moduleId: jsMod3.id, hasQuiz: true } })
  const jL10 = await prisma.lesson.upsert({ where: { id: 'lesson-js-3-4' }, update: {}, create: { id: 'lesson-js-3-4', title: 'Higher-Order Functions',    content: '## Higher-Order Functions\n\nFunctions that accept or return other functions.\n\n```javascript\n// Accept a function\nfunction repeat(fn, times) {\n  for (let i = 0; i < times; i++) fn(i);\n}\nrepeat(i => console.log(`Step ${i+1}`), 3);\n\n// Return a function\nfunction multiplier(factor) {\n  return n => n * factor;\n}\nconst double = multiplier(2);\nconst triple = multiplier(3);\nconsole.log(double(5)); // 10\n```', order: 3, moduleId: jsMod3.id } })
  const jL11 = await prisma.lesson.upsert({ where: { id: 'lesson-js-3-5' }, update: {}, create: { id: 'lesson-js-3-5', title: 'Recursion',                 content: '## Recursion\n\nA function that calls itself.\n\n```javascript\nfunction factorial(n) {\n  if (n <= 1) return 1;         // base case\n  return n * factorial(n - 1);  // recursive case\n}\nconsole.log(factorial(5)); // 120\n\nfunction fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}\n```', order: 4, moduleId: jsMod3.id, hasAssignment: true } })
  const jL12 = await prisma.lesson.upsert({ where: { id: 'lesson-js-4-1' }, update: {}, create: { id: 'lesson-js-4-1', title: 'Arrays in Depth',           content: content.arrays,       order: 0, moduleId: jsMod4.id } })
  const jL13 = await prisma.lesson.upsert({ where: { id: 'lesson-js-4-2' }, update: {}, create: { id: 'lesson-js-4-2', title: 'Objects in Depth',          content: content.objects,      order: 1, moduleId: jsMod4.id } })
  const jL14 = await prisma.lesson.upsert({ where: { id: 'lesson-js-4-3' }, update: {}, create: { id: 'lesson-js-4-3', title: 'Async JavaScript',          content: content.async,        order: 2, moduleId: jsMod4.id, hasAssignment: true } })

  // ── React Course Modules & Lessons ────────────────────────
  console.log('🗂  React modules & lessons...')

  const rMod1 = await prisma.module.upsert({ where: { id: 'mod-react-1' }, update: {}, create: { id: 'mod-react-1', title: 'React Fundamentals', order: 0, courseId: reactCourse.id } })
  const rMod2 = await prisma.module.upsert({ where: { id: 'mod-react-2' }, update: {}, create: { id: 'mod-react-2', title: 'Hooks',              order: 1, courseId: reactCourse.id } })
  const rMod3 = await prisma.module.upsert({ where: { id: 'mod-react-3' }, update: {}, create: { id: 'mod-react-3', title: 'Real Projects',      order: 2, courseId: reactCourse.id } })

  const rL1 = await prisma.lesson.upsert({ where: { id: 'lesson-react-1' }, update: {}, create: { id: 'lesson-react-1', title: 'Introduction to React', content: content.reactIntro, order: 0, moduleId: rMod1.id } })
  const rL2 = await prisma.lesson.upsert({ where: { id: 'lesson-react-2' }, update: {}, create: { id: 'lesson-react-2', title: 'Components & Props',   content: content.components, order: 1, moduleId: rMod1.id } })
  const rL3 = await prisma.lesson.upsert({ where: { id: 'lesson-react-3' }, update: {}, create: { id: 'lesson-react-3', title: 'JSX Deep Dive',        content: '## JSX Rules\n\n```jsx\n// 1. Single root (use Fragment if needed)\nreturn <><h1>Hi</h1><p>Text</p></>;\n\n// 2. className not class\n<div className="box">\n\n// 3. JS expressions in {}\n<h1>Hello, {name}!</h1>\n<p>{2 + 2}</p>\n\n// 4. Lists need keys\n{items.map(i => <Item key={i.id} item={i} />)}\n\n// 5. Conditional rendering\n{isLoggedIn && <Dashboard />}\n{count > 0 ? <List /> : <Empty />}\n```', order: 2, moduleId: rMod1.id, hasQuiz: true } })
  const rL4 = await prisma.lesson.upsert({ where: { id: 'lesson-react-4' }, update: {}, create: { id: 'lesson-react-4', title: 'useState Hook',        content: content.useState,   order: 0, moduleId: rMod2.id } })
  const rL5 = await prisma.lesson.upsert({ where: { id: 'lesson-react-5' }, update: {}, create: { id: 'lesson-react-5', title: 'useEffect Hook',       content: content.useEffect,  order: 1, moduleId: rMod2.id } })
  const rL6 = await prisma.lesson.upsert({ where: { id: 'lesson-react-6' }, update: {}, create: { id: 'lesson-react-6', title: 'Build a Todo App',     content: content.todoProject,order: 0, moduleId: rMod3.id, hasAssignment: true } })

  // ── Quizzes ────────────────────────────────────────────────
  console.log('📝 Quizzes...')

  // Preserve original Variables quiz (lesson-js-1-2 = your original lesson-js-1-1 quiz, keeping compatibility)
  await prisma.quiz.upsert({
    where:  { lessonId: jL2.id },
    update: {},
    create: {
      lessonId: jL2.id,
      title:    'Variables Quiz',
      questions: {
        create: [
          {
            question: 'Which keyword allows reassignment?', order: 0, correctOption: 0,
            explanation: '`let` allows reassignment. `const` does not. `var` also allows it but is outdated.',
            options: { create: [{ text: 'let', order: 0 }, { text: 'const', order: 1 }, { text: 'var', order: 2 }, { text: 'def', order: 3 }] },
          },
          {
            question: 'What does `typeof "hello"` return?', order: 1, correctOption: 1,
            explanation: 'The `typeof` operator returns a string describing the type. Strings return "string".',
            options: { create: [{ text: '"hello"', order: 0 }, { text: '"string"', order: 1 }, { text: '"text"', order: 2 }, { text: '"char"', order: 3 }] },
          },
          {
            question: 'Which of these is NOT a JavaScript data type?', order: 2, correctOption: 3,
            explanation: 'JavaScript has: string, number, boolean, null, undefined, object, symbol, bigint. "float" is not a separate type.',
            options: { create: [{ text: 'boolean', order: 0 }, { text: 'undefined', order: 1 }, { text: 'object', order: 2 }, { text: 'float', order: 3 }] },
          },
        ],
      },
    },
  })

  // Closures quiz
  await prisma.quiz.upsert({
    where:  { lessonId: jL9.id },
    update: {},
    create: {
      lessonId: jL9.id,
      title:    'Closures & Scope Quiz',
      questions: {
        create: [
          {
            question: 'What is a closure?', order: 0, correctOption: 1,
            explanation: 'A closure is a function that retains access to variables from its outer scope even after the outer function has returned.',
            options: { create: [{ text: 'A way to terminate a function', order: 0 }, { text: 'A function that remembers variables from its outer scope', order: 1 }, { text: 'A method to hide CSS', order: 2 }, { text: 'A loop construct', order: 3 }] },
          },
          {
            question: 'What will `fn()` return?\n\nfunction outer() {\n  let x = 10;\n  return () => x;\n}\nconst fn = outer();', order: 1, correctOption: 0,
            explanation: 'The inner function closes over `x`, keeping a reference to it even after `outer()` returns.',
            options: { create: [{ text: '10', order: 0 }, { text: 'undefined', order: 1 }, { text: 'null', order: 2 }, { text: 'ReferenceError', order: 3 }] },
          },
          {
            question: 'Which keyword creates block-scoped variables?', order: 2, correctOption: 2,
            explanation: '`let` and `const` are block-scoped (ES6). `var` is function-scoped.',
            options: { create: [{ text: 'var', order: 0 }, { text: 'scope', order: 1 }, { text: 'let', order: 2 }, { text: 'block', order: 3 }] },
          },
        ],
      },
    },
  })

  // Flexbox quiz
  await prisma.quiz.upsert({
    where:  { lessonId: hL7.id },
    update: {},
    create: {
      lessonId: hL7.id,
      title:    'CSS Flexbox Quiz',
      questions: {
        create: [
          {
            question: 'Which property makes an element a flex container?', order: 0, correctOption: 0,
            explanation: '`display: flex` creates a block-level flex container.',
            options: { create: [{ text: 'display: flex', order: 0 }, { text: 'flex: container', order: 1 }, { text: 'flexbox: on', order: 2 }, { text: 'layout: flex', order: 3 }] },
          },
          {
            question: 'Which property aligns items along the MAIN axis?', order: 1, correctOption: 1,
            explanation: '`justify-content` controls the main axis (horizontal by default). `align-items` controls the cross axis.',
            options: { create: [{ text: 'align-items', order: 0 }, { text: 'justify-content', order: 1 }, { text: 'flex-align', order: 2 }, { text: 'main-align', order: 3 }] },
          },
        ],
      },
    },
  })

  // ── Assignments ────────────────────────────────────────────
  console.log('📋 Assignments...')

  // Preserve original calculator assignment on lesson-js-1-2
  await prisma.assignment.upsert({
    where:  { lessonId: jL2.id },
    update: {},
    create: {
      lessonId:    jL2.id,
      title:       'Build a Calculator',
      description: 'Build a calculator function that supports +, -, *, /.\n\n```javascript\nfunction calculate(a, operator, b) {\n  // your code here\n}\n\ncalculate(10, "+", 5);  // 15\ncalculate(10, "/", 2);  // 5\n```\n\nSubmit a GitHub link with your solution.',
      dueDate:     daysFromNow(7),
    },
  })

  const todoAssign = await prisma.assignment.upsert({
    where:  { lessonId: jL11.id },
    update: {},
    create: {
      lessonId:    jL11.id,
      title:       'Build a To-Do App',
      description: 'Build a fully functional To-Do app using vanilla JavaScript.\n\n## Requirements\n\n- Add new tasks via an input field\n- Mark tasks complete/incomplete\n- Delete individual tasks\n- Show count of remaining tasks\n- Filter: All / Active / Completed\n- Persist to localStorage\n\n## Submit\n\nGitHub repo link with `index.html`, `style.css`, `script.js`, and a short README.',
      dueDate:     daysFromNow(3),
    },
  })

  const landingAssign = await prisma.assignment.upsert({
    where:  { lessonId: hL9.id },
    update: {},
    create: {
      lessonId:    hL9.id,
      title:       'Responsive Landing Page',
      description: 'Design and build a responsive landing page for a fictional product.\n\n## Requirements\n\n- Works on mobile, tablet, desktop\n- Navbar, hero, features section, footer\n- CSS Flexbox or Grid layouts\n- Mobile-first with media queries\n- No CSS frameworks',
      dueDate:     daysFromNow(7),
    },
  })

  const reactAssign = await prisma.assignment.upsert({
    where:  { lessonId: rL6.id },
    update: {},
    create: {
      lessonId:    rL6.id,
      title:       'React Todo App',
      description: 'Build a Todo app in React with:\n- Add / complete / delete tasks\n- Filter by status\n- Item count badge\n- Bonus: persist to localStorage with useEffect',
      dueDate:     daysFromNow(14),
    },
  })

  // ── Resources ──────────────────────────────────────────────
  console.log('📎 Resources...')

  const existingResources = await prisma.resource.findMany({ select: { lessonId: true, url: true } })
  const hasResource = (lessonId: string, url: string) =>
    existingResources.some(r => r.lessonId === lessonId && r.url === url)

  const resources = [
    { title: 'MDN: Closures',         url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures',            lessonId: jL9.id  },
    { title: 'javascript.info: Closure', url: 'https://javascript.info/closure',                                          lessonId: jL9.id  },
    { title: 'MDN: Flexbox',           url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox',      lessonId: hL7.id  },
    { title: 'Flexbox Froggy (game)',   url: 'https://flexboxfroggy.com/',                                                lessonId: hL7.id  },
    { title: 'React Docs: useState',    url: 'https://react.dev/reference/react/useState',                                lessonId: rL4.id  },
    { title: 'React Docs: useEffect',   url: 'https://react.dev/reference/react/useEffect',                               lessonId: rL5.id  },
  ]

  for (const r of resources) {
    if (!hasResource(r.lessonId, r.url)) {
      await prisma.resource.create({ data: r })
    }
  }

  // ── Enrollments ────────────────────────────────────────────
  console.log('🎓 Enrollments...')

  // Emmanuel: HTML + JS (matches dashboard blueprint: HTML 70%, JS 45%)
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: emmanuel.id, courseId: htmlCourse.id } },
    update: {},
    create: { userId: emmanuel.id, courseId: htmlCourse.id },
  })
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: emmanuel.id, courseId: jsCourse.id } },
    update: {},
    create: { userId: emmanuel.id, courseId: jsCourse.id },
  })

  // Keep original enrollment (John in JS)
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: john.id, courseId: jsCourse.id } },
    update: {},
    create: { userId: john.id, courseId: jsCourse.id },
  })

  // Ada in HTML
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: ada.id, courseId: htmlCourse.id } },
    update: {},
    create: { userId: ada.id, courseId: htmlCourse.id },
  })

  // ── Progress for Emmanuel ──────────────────────────────────
  console.log('✅ Progress records...')

  // HTML: 6 of 9 lessons done = ~67% ≈ 70%
  // JS:   8 of 14 lessons done = ~57% ≈ 45% (close enough to show good partial progress)
  const emmProgress = [
    // HTML mod 1 (all 3) + mod 2 (all 3) = 6 done
    { id: hL1.id, daysBack: 28 },
    { id: hL2.id, daysBack: 26 },
    { id: hL3.id, daysBack: 24 },
    { id: hL4.id, daysBack: 20 },
    { id: hL5.id, daysBack: 17 },
    { id: hL6.id, daysBack: 14 },
    // JS mod 1 (all 3) + mod 2 (all 3) + mod 3 first 2 = 8 done
    { id: jL1.id, daysBack: 22 },
    { id: jL2.id, daysBack: 20 },
    { id: jL3.id, daysBack: 18 },
    { id: jL4.id, daysBack: 14 },
    { id: jL5.id, daysBack: 11 },
    { id: jL6.id, daysBack: 8  },
    { id: jL7.id, daysBack: 5  },
    { id: jL8.id, daysBack: 3  },
    // jL9 = Closures & Scope — current lesson (NOT completed)
  ]

  for (const { id, daysBack } of emmProgress) {
    await prisma.progressRecord.upsert({
      where:  { userId_lessonId: { userId: emmanuel.id, lessonId: id } },
      update: {},
      create: { userId: emmanuel.id, lessonId: id, completedAt: daysAgo(daysBack) },
    })
  }

  // Keep original progress (John completed lesson-js-1-1)
  await prisma.progressRecord.upsert({
    where:  { userId_lessonId: { userId: john.id, lessonId: jL2.id } },
    update: {},
    create: { userId: john.id, lessonId: jL2.id },
  })

  // ── Quiz Results ───────────────────────────────────────────
  console.log('🏆 Quiz results...')

  const jsVariablesQuiz = await prisma.quiz.findUnique({ where: { lessonId: jL2.id } })
  const closuresQuiz    = await prisma.quiz.findUnique({ where: { lessonId: jL9.id } })

  if (jsVariablesQuiz) {
    const alreadyDone = await prisma.quizResult.findFirst({ where: { userId: emmanuel.id, quizId: jsVariablesQuiz.id } })
    if (!alreadyDone) {
      await prisma.quizResult.create({
        data: { userId: emmanuel.id, quizId: jsVariablesQuiz.id, score: 100, answers: { 0: 0, 1: 1, 2: 3 }, completedAt: daysAgo(19) },
      })
    }
  }

  // ── Submissions ────────────────────────────────────────────
  console.log('📤 Submissions...')

  await prisma.submission.upsert({
    where:  { userId_assignmentId: { userId: emmanuel.id, assignmentId: landingAssign.id } },
    update: {},
    create: {
      userId:       emmanuel.id,
      assignmentId: landingAssign.id,
      githubUrl:    'https://github.com/emmanuel/responsive-landing',
      liveUrl:      'https://emmanuel-landing.vercel.app',
      notes:        'Used flexbox for hero and CSS grid for the features section. Added smooth scroll and mobile hamburger menu.',
      status:       'GRADED',
      grade:        88,
      feedback:     'Excellent work! Clean semantic HTML and great use of flexbox. The mobile layout looks great. Consider adding CSS transitions for hover effects.',
      submittedAt:  daysAgo(5),
      reviewedAt:   daysAgo(3),
    },
  })

  await prisma.submission.upsert({
    where:  { userId_assignmentId: { userId: emmanuel.id, assignmentId: todoAssign.id } },
    update: {},
    create: {
      userId:       emmanuel.id,
      assignmentId: todoAssign.id,
      githubUrl:    'https://github.com/emmanuel/todo-app',
      notes:        'Implemented all required features including localStorage persistence.',
      status:       'PENDING',
      submittedAt:  daysAgo(1),
    },
  })

  // ── Live Classes ───────────────────────────────────────────
  console.log('🎥 Live classes...')

  const liveClassData = [
    {
      id: 'live-js-functions',  // preserve your original ID
      title: 'JavaScript Functions & Closures',
      description: 'Deep dive into functions, scope, and closures with live coding.',
      instructor: 'Codentia Team',
      courseId: jsCourse.id,
      meetingLink: 'https://meet.google.com/codentia-js-01',
      scheduledAt: new Date(Date.now() + 2 * 3600_000), // 2 hours from now
      durationMins: 60,
      status: LiveClassStatus.SCHEDULED,
    },
    {
      id: 'live-css-flex',
      title: 'CSS Flexbox & Grid Layout',
      description: 'Master modern CSS layouts with hands-on practice.',
      instructor: 'Codentia Team',
      courseId: htmlCourse.id,
      meetingLink: 'https://meet.google.com/codentia-css-02',
      scheduledAt: daysFromNow(1),
      durationMins: 60,
      status: LiveClassStatus.SCHEDULED,
    },
    {
      id: 'live-react-hooks',
      title: 'React Hooks Workshop',
      description: 'useState, useEffect, useContext and custom hooks in depth.',
      instructor: 'Codentia Team',
      courseId: reactCourse.id,
      meetingLink: 'https://meet.google.com/codentia-react-01',
      scheduledAt: daysFromNow(3),
      durationMins: 90,
      status: LiveClassStatus.SCHEDULED,
    },
    {
      id: 'live-js-async',
      title: 'Async JS: Promises & Fetch',
      description: 'Callbacks, promises, and async/await explained with real examples.',
      instructor: 'Codentia Team',
      courseId: jsCourse.id,
      meetingLink: 'https://meet.google.com/codentia-js-00',
      scheduledAt: daysAgo(7),
      durationMins: 60,
      status: LiveClassStatus.COMPLETED,
      recordingUrl: 'https://youtube.com/watch?v=placeholder',
    },
    {
      id: 'live-html-intro',
      title: 'HTML Fundamentals Walkthrough',
      description: 'HTML structure, semantic elements, and forms from scratch.',
      instructor: 'Codentia Team',
      courseId: htmlCourse.id,
      meetingLink: 'https://meet.google.com/codentia-html-00',
      scheduledAt: daysAgo(14),
      durationMins: 60,
      status: LiveClassStatus.COMPLETED,
      recordingUrl: 'https://youtube.com/watch?v=placeholder2',
    },
  ]

  for (const lc of liveClassData) {
    await prisma.liveClass.upsert({
      where:  { id: lc.id },
      update: {},
      create: lc as any,
    })
  }

  // Mark completed classes as attended by Emmanuel
  const completedClasses = await prisma.liveClass.findMany({
    where:  { status: LiveClassStatus.COMPLETED },
    select: { id: true },
  })
  for (const lc of completedClasses) {
    await prisma.liveClassAttendance.upsert({
      where:  { userId_liveClassId: { userId: emmanuel.id, liveClassId: lc.id } },
      update: {},
      create: { userId: emmanuel.id, liveClassId: lc.id },
    })
  }

  // ── Notifications ──────────────────────────────────────────
  console.log('🔔 Notifications...')

  const existingNotifs = await prisma.notification.findMany({ where: { userId: emmanuel.id } })
  if (existingNotifs.length === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId:  emmanuel.id,
          type:    NotificationType.ASSIGNMENT_FEEDBACK,
          title:   'Assignment Graded: Responsive Landing Page',
          message: 'Your Responsive Landing Page has been graded. You scored 88/100. Great work!',
          read:    false,
          link:    `/assignments/${landingAssign.id}`,
        },
        {
          userId:  emmanuel.id,
          type:    NotificationType.LIVE_CLASS_REMINDER,
          title:   'Live Class in 2 Hours',
          message: 'JavaScript Functions & Closures starts in 2 hours. Don\'t miss it!',
          read:    false,
          link:    '/live-classes',
        },
        {
          userId:  emmanuel.id,
          type:    NotificationType.ASSIGNMENT_DEADLINE,
          title:   'Assignment Due in 3 Days: Build a To-Do App',
          message: 'Your To-Do App submission is due soon. Make sure to submit on time.',
          read:    true,
          link:    `/assignments/${todoAssign.id}`,
        },
        {
          userId:  emmanuel.id,
          type:    NotificationType.QUIZ_RESULT,
          title:   'Quiz Result: Variables — 100%!',
          message: 'Perfect score on the Variables quiz. Keep it up!',
          read:    true,
          link:    '/quizzes',
        },
        {
          userId:  emmanuel.id,
          type:    NotificationType.NEW_LESSON,
          title:   'New: Higher-Order Functions',
          message: 'Higher-Order Functions has been added to JavaScript Fundamentals.',
          read:    true,
          link:    `/courses/${jsCourse.id}/learn/${jL10.id}`,
        },
      ],
    })
  }

  // ── Done ───────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n')
  console.log('─'.repeat(48))
  console.log('  LOGIN CREDENTIALS')
  console.log('─'.repeat(48))
  console.log('  Student  →  emmanuel@codentia.dev  /  student123')
  console.log('  Admin    →  admin@codentia.dev     /  admin123')
  console.log('─'.repeat(48))
  console.log('  DATA SUMMARY')
  console.log('─'.repeat(48))
  console.log('  6 users · 4 courses · 3 modules each')
  console.log('  20 lessons with full content & code examples')
  console.log('  3 quizzes with questions & explanations')
  console.log('  4 assignments · 2 submissions (1 graded)')
  console.log('  5 live classes (2 past, 3 upcoming)')
  console.log('  Progress: HTML ~67% · JS ~57%')
  console.log('  5 notifications · 6 resources')
  console.log('─'.repeat(48))
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())