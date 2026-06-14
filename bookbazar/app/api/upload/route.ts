import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return Response.json({ message: "No file provided" }, { status: 400 });
  }

  const byte = await file.arrayBuffer();
  const buffer = Buffer.from(byte);

  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "bookmandu/books" },
      (error, uploadResult) => {
        if (error) return reject(error);
        return resolve(uploadResult);
      }
    ).end(buffer);
  });

  return Response.json({ url: (uploadResult as any).secure_url });
}