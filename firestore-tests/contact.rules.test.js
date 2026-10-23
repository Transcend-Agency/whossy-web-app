// Emulator tests for the contactMessages rule: the public contact form's
// write-only mailbox. Run with the rest of `npm run test:rules`.

const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  Timestamp,
} = require("firebase/firestore");

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "whossy-contact-rules-test",
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8"),
    },
  });
});

test.after(async () => {
  await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

const message = (overrides = {}) => ({
  name: "Ada Obi",
  email: "ada@example.com",
  message: "Hello, I have a question about premium.",
  createdAt: serverTimestamp(),
  ...overrides,
});

const anonDb = () => testEnv.unauthenticatedContext().firestore();

test("signed out visitors can send a message", async () => {
  await assertSucceeds(addDoc(collection(anonDb(), "contactMessages"), message()));
});

test("signed in users can send a message", async () => {
  const db = testEnv.authenticatedContext("alice").firestore();
  await assertSucceeds(addDoc(collection(db, "contactMessages"), message()));
});

test("a message with extra or missing fields is rejected", async () => {
  const db = anonDb();
  await assertFails(addDoc(collection(db, "contactMessages"), message({ isRead: true })));
  const { email, ...withoutEmail } = message();
  await assertFails(addDoc(collection(db, "contactMessages"), withoutEmail));
});

test("malformed or oversized fields are rejected", async () => {
  const db = anonDb();
  const send = (overrides) => addDoc(collection(db, "contactMessages"), message(overrides));
  await assertFails(send({ name: "" }));
  await assertFails(send({ name: "a".repeat(101) }));
  await assertFails(send({ email: "not-an-email" }));
  await assertFails(send({ email: "ada @example.com" }));
  await assertFails(send({ email: `${"a".repeat(250)}@x.co` }));
  await assertFails(send({ message: "" }));
  await assertFails(send({ message: "a".repeat(5001) }));
  await assertFails(send({ message: 42 }));
  await assertSucceeds(send({ message: "a".repeat(5000) }));
});

test("createdAt must be the server time", async () => {
  const db = anonDb();
  await assertFails(
    addDoc(collection(db, "contactMessages"), message({ createdAt: Timestamp.fromDate(new Date("2020-01-01")) }))
  );
});

test("messages cannot be read, edited or deleted from a client", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "contactMessages/m1"), message({ createdAt: Timestamp.now() }));
  });
  for (const db of [anonDb(), testEnv.authenticatedContext("alice").firestore()]) {
    const ref = doc(db, "contactMessages/m1");
    await assertFails(getDoc(ref));
    await assertFails(updateDoc(ref, { message: "changed" }));
    await assertFails(deleteDoc(ref));
  }
});
