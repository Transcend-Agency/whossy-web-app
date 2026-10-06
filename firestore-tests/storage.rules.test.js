// Emulator tests for storage.rules: who may upload, read and delete under
// users/{uid}/..., and that uploads are images of a sane size.

const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { ref, uploadBytes, getBytes, deleteObject } = require("firebase/storage");

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-whossy-rules",
    storage: { rules: fs.readFileSync(path.resolve(__dirname, "../storage.rules"), "utf8") },
  });
});
test.after(() => testEnv.cleanup());
test.beforeEach(() => testEnv.clearStorage());

const as = (uid) => testEnv.authenticatedContext(uid).storage();
const anon = () => testEnv.unauthenticatedContext().storage();
const image = (bytes = 1024) => new Uint8Array(bytes);
const jpeg = { contentType: "image/jpeg" };

async function seed(filePath) {
  await testEnv.withSecurityRulesDisabled((ctx) => uploadBytes(ref(ctx.storage(), filePath), image(), jpeg));
}

test("a user uploads and deletes their own profile photos; nobody else can", async () => {
  await assertSucceeds(uploadBytes(ref(as("alice"), "users/alice/profile_pictures/a.jpg"), image(), jpeg));
  await assertFails(uploadBytes(ref(as("mallory"), "users/alice/profile_pictures/b.jpg"), image(), jpeg));
  await assertFails(deleteObject(ref(as("mallory"), "users/alice/profile_pictures/a.jpg")));
  await assertSucceeds(deleteObject(ref(as("alice"), "users/alice/profile_pictures/a.jpg")));
});

test("profile photos are readable by signed-in users and not by the public", async () => {
  await seed("users/alice/profile_pictures/a.jpg");
  await assertSucceeds(getBytes(ref(as("bob"), "users/alice/profile_pictures/a.jpg")));
  await assertFails(getBytes(ref(anon(), "users/alice/profile_pictures/a.jpg")));
});

test("a verification selfie can be read only by its owner", async () => {
  await assertSucceeds(uploadBytes(ref(as("alice"), "users/alice/face_verification/captured-image.png"), image(), { contentType: "image/png" }));
  await assertSucceeds(getBytes(ref(as("alice"), "users/alice/face_verification/captured-image.png")));
  await assertFails(getBytes(ref(as("bob"), "users/alice/face_verification/captured-image.png")));
  await assertFails(uploadBytes(ref(as("bob"), "users/alice/face_verification/fake.png"), image(), { contentType: "image/png" }));
});

test("chat images: only the sender uploads into their own folder", async () => {
  await assertSucceeds(uploadBytes(ref(as("alice"), "users/alice/chat_images/alice_bob_1.jpg"), image(), jpeg));
  await assertFails(uploadBytes(ref(as("bob"), "users/alice/chat_images/x.jpg"), image(), jpeg));
  await assertSucceeds(getBytes(ref(as("bob"), "users/alice/chat_images/alice_bob_1.jpg")));
});

test("uploads must be images under 10 MB", async () => {
  const mine = (name) => ref(as("alice"), `users/alice/profile_pictures/${name}`);
  await assertFails(uploadBytes(mine("script.html"), image(), { contentType: "text/html" }));
  await assertFails(uploadBytes(mine("app.apk"), image(), { contentType: "application/octet-stream" }));
  await assertFails(uploadBytes(mine("huge.jpg"), image(10 * 1024 * 1024 + 1), jpeg));
  await assertSucceeds(uploadBytes(mine("big-but-ok.jpg"), image(9 * 1024 * 1024), jpeg));
});

test("nothing outside the three user folders can be read or written, including the old chat image path", async () => {
  await assertFails(uploadBytes(ref(as("alice"), "chats/alice_bob/photo.jpg"), image(), jpeg));
  await assertFails(uploadBytes(ref(as("alice"), "users/alice/other/x.jpg"), image(), jpeg));
  await assertFails(uploadBytes(ref(as("alice"), "anything.jpg"), image(), jpeg));
  await assertFails(getBytes(ref(as("alice"), "anything.jpg")));
});
