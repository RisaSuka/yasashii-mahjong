# MVP-0.2 Win Check Test Cases

This document lists test cases for the MVP-0.2 winning-shape checker. It is a planning document only. Do not add implementation code from this file during MVP-0.1.

Tile notation:

- `m`: characters
- `p`: circles
- `s`: bamboo
- `z`: honors
- `z1 z2 z3 z4 z5 z6 z7`: east, south, west, north, white, green, red

## Test Fixture Helper Idea

Tests can use a local helper to create tile objects:

```js
tile("m", 1, 0)
```

or parse compact strings:

```js
tiles("m1 m2 m3 p4 p5 p6 s7 s8 s9 z1 z1 m9 m9 m9")
```

The helper should create MVP-0.1-compatible tile objects. It should live in test files, not production code, unless production code genuinely needs it later.

## Standard Hand Success Cases

### Four sequences and one pair

```text
m1 m2 m3 / m4 m5 m6 / p2 p3 p4 / s7 s8 s9 / z1 z1
```

Expected:

```js
{ winning: true, type: "standard" }
```

### Triplets plus pair

```text
m1 m1 m1 / p2 p2 p2 / s3 s3 s3 / z5 z5 z5 / z1 z1
```

Expected:

```js
{ winning: true, type: "standard" }
```

### Mixed sequences and triplets

```text
m2 m3 m4 / m7 m8 m9 / p5 p5 p5 / z3 z3 z3 / s1 s1
```

Expected:

```js
{ winning: true, type: "standard" }
```

### Honor pair with number melds

```text
m1 m2 m3 / p3 p4 p5 / p7 p8 p9 / s4 s4 s4 / z7 z7
```

Expected:

```js
{ winning: true, type: "standard" }
```

## Seven Pairs Success Cases

### Seven distinct pairs

```text
m1 m1 / m9 m9 / p2 p2 / p8 p8 / s3 s3 / s7 s7 / z5 z5
```

Expected:

```js
{ winning: true, type: "seven-pairs" }
```

### Seven pairs with honors

```text
m2 m2 / m5 m5 / p3 p3 / p6 p6 / s1 s1 / z1 z1 / z7 z7
```

Expected:

```js
{ winning: true, type: "seven-pairs" }
```

## Thirteen Orphans Success Cases

### Duplicate east

```text
m1 m9 p1 p9 s1 s9 z1 z1 z2 z3 z4 z5 z6 z7
```

Expected:

```js
{ winning: true, type: "thirteen-orphans" }
```

### Duplicate terminal

```text
m1 m1 m9 p1 p9 s1 s9 z1 z2 z3 z4 z5 z6 z7
```

Expected:

```js
{ winning: true, type: "thirteen-orphans" }
```

## Incomplete Hand Cases

### Random incomplete 14 tiles

```text
m1 m2 m4 / m5 m7 m9 / p1 p3 p6 / s2 s5 s8 / z1 z3
```

Expected:

```js
{ winning: false, type: null, reason: "no-winning-shape" }
```

### Six pairs plus two unrelated singles

```text
m1 m1 / m2 m2 / p3 p3 / p4 p4 / s5 s5 / z1 z1 / m9 p9
```

Expected:

```js
{ winning: false, type: null, reason: "no-winning-shape" }
```

### Thirteen orphans missing one required tile

```text
m1 m9 p1 p9 s1 s9 z1 z1 z2 z3 z4 z5 z6 m5
```

Expected:

```js
{ winning: false, type: null, reason: "no-winning-shape" }
```

## Invalid Tile Count Cases

### 13 tiles

```text
m1 m2 m3 / m4 m5 m6 / p2 p3 p4 / s7 s8 s9 / z1
```

Expected:

```js
{ winning: false, type: null, reason: "not-14-tiles" }
```

### 15 tiles

```text
m1 m2 m3 / m4 m5 m6 / p2 p3 p4 / s7 s8 s9 / z1 z1 z2
```

Expected:

```js
{ winning: false, type: null, reason: "not-14-tiles" }
```

### Empty hand

```text

```

Expected:

```js
{ winning: false, type: null, reason: "not-14-tiles" }
```

## Impossible Copy Cases

### Five copies of one tile

```text
m1 m1 m1 m1 m1 / m2 m3 m4 / p2 p3 p4 / s7 s8 s9
```

Expected:

```js
{ winning: false, type: null, reason: "too-many-copies" }
```

### Five copies inside otherwise valid-looking seven pairs

```text
m1 m1 m1 m1 m1 / p2 p2 / p3 p3 / s4 s4 / z1 z1 / z2
```

Expected:

```js
{ winning: false, type: null, reason: "too-many-copies" }
```

## Multiple Interpretation Cases

### Could be reduced in more than one way

```text
m1 m1 m1 / m2 m3 m4 / m2 m3 m4 / p5 p6 p7 / z1 z1
```

Expected:

```js
{ winning: true, type: "standard" }
```

### Pair choice matters

```text
m1 m1 m2 m2 m3 m3 / p4 p5 p6 / s7 s8 s9 / z2 z2
```

Expected:

```js
{ winning: true, type: "standard" }
```

## Honor Tile Cases

### Honor triplet is valid

```text
z1 z1 z1 / z5 z5 z5 / m1 m2 m3 / p7 p8 p9 / s9 s9
```

Expected:

```js
{ winning: true, type: "standard" }
```

### Honor sequence is invalid

```text
z1 z2 z3 / m1 m2 m3 / p1 p2 p3 / s1 s2 s3 / z5 z5
```

Expected:

```js
{ winning: false, type: null, reason: "no-winning-shape" }
```

## Terminal And Simple Tile Mixed Cases

### Terminals and simples mixed successfully

```text
m7 m8 m9 / p1 p2 p3 / s4 s5 s6 / s7 s7 s7 / m5 m5
```

Expected:

```js
{ winning: true, type: "standard" }
```

### Terminals mixed but incomplete

```text
m1 m3 m9 / p1 p4 p9 / s1 s5 s9 / z1 z2 z3 / m5 m5
```

Expected:

```js
{ winning: false, type: null, reason: "no-winning-shape" }
```

