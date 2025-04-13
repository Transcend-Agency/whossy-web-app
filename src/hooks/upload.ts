import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";

const upload = async (file: File, location?: string): Promise<string> => {
  const date = new Date();
  const storage = getStorage();
  const url: string = location ? `${location}/${file.name}` : `images/${date + file.name}`
  const storageRef = ref(storage, url);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        reject("Something went wrong!" + error.code);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

export default upload;