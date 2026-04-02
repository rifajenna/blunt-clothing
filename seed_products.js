import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import https from "https";
import Product from "./models/Product.js";
import Category from "./models/Category.js";

dotenv.config();

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    });
  });
};

const itemsToSeed = [
  {
    categoryName: "Hoodies",
    products: [
      {
        name: "Reaven Black Unisex Zipper Hoodie",
        price: 2399,
        description: "240 GSM Cotton Terry\nCrewneck Drop Shoulders\nBoxy Oversized Fit\nBlack Unique Colour\nBiowashed | Combed | Hypo-Allergic Fabric",
        images: [
          "https://genrage.com/cdn/shop/files/Reaven_Black_Unisex_Zipper_Hoodie_front.png?v=1767698142&width=1000",
          "https://genrage.com/cdn/shop/files/Reaven_Black_Unisex_Zipper_Hoodie_downtilt.png?v=1767698181&width=1000"
        ]
      },
      {
        name: "Pierce Black Boxy-Oversized Hoodie",
        price: 2199,
        description: "240 GSM Cotton Terry\nCrewneck Drop Shoulders\nBoxy Oversized Fit\nBlack Unique Colour\nBiowashed | Combed | Hypo-Allergic Fabric",
        images: [
          "https://genrage.com/cdn/shop/files/Pierce_Black_Boxy-Oversized_Hoodie_front.png?v=1770181432&width=1000",
          "https://genrage.com/cdn/shop/files/Pierce_Black_Boxy-Oversized_Hoodie_back.png?v=1770181450&width=1000"
        ]
      },
      {
        name: "Lean Black Boxy Oversized Hoodie",
        price: 2199,
        description: "240 GSM Cotton Terry\nCrewneck Drop Shoulders\nBoxy Oversized Fit\nBlack Unique Colour\nBiowashed | Combed | Hypo-Allergic Fabric",
        images: [
          "https://genrage.com/cdn/shop/files/Lean_Black_Boxy_Oversized_Hoodie_front.png?v=1770181305&width=1000",
          "https://genrage.com/cdn/shop/files/Lean_Black_Boxy_Oversized_Hoodie_tilt.png?v=1770181343&width=1000"
        ]
      }
    ]
  },
  {
    categoryName: "Pants",
    products: [
      {
        name: "Mutation Unisex Straight Fit Baggy Pants",
        price: 1599,
        description: "Premium Cotton Fabric\nStraight Fit Baggy Style\nAuthentic Genrage Aesthetics\nComfortable & Durable",
        images: [
          "https://genrage.com/cdn/shop/files/Mutation_Unisex_Straight_Fit_Baggy_Pants_front.png?v=1767938346&width=1000",
          "https://genrage.com/cdn/shop/files/Mutation_Unisex_Straight_Fit_Baggy_Pants_back.png?v=1767938361&width=1000"
        ]
      },
      {
        name: "Pythonic Unisex Straight Fit Baggy Pants",
        price: 1599,
        description: "Premium Cotton Fabric\nStraight Fit Baggy Style\nAuthentic Genrage Aesthetics\nComfortable & Durable",
        images: [
          "https://genrage.com/cdn/shop/files/front..png?v=1765195548&width=1000",
          "https://genrage.com/cdn/shop/files/Pythonic_Unisex_Straight_Fit_Baggy_Pants_back.png?v=1765195548&width=1000"
        ]
      },
      {
        name: "Dawn Unisex Straight Fit Baggy Pants",
        price: 1699,
        description: "Premium Cotton Fabric\nStraight Fit Baggy Style\nAuthentic Genrage Aesthetics\nComfortable & Durable",
        images: [
          "https://genrage.com/cdn/shop/files/Dawn_Unisex_Straight_Fit_Baggy_Pants_front.png?v=1767961149&width=1000",
          "https://genrage.com/cdn/shop/files/Dawn_Unisex_Straight_Fit_Baggy_Pants_zoom.png?v=1752580719&width=1000"
        ]
      }
    ]
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce");
    console.log("Connected to DB.");

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const group of itemsToSeed) {
      console.log(`Processing Category: ${group.categoryName}...`);
      let category = await Category.findOne({ name: group.categoryName });
      
      if (!category) {
        category = new Category({ 
          name: group.categoryName, 
          description: `${group.categoryName} from Genrage collection` 
        });
        await category.save();
        console.log(`Created new Category: ${group.categoryName}`);
      }

      for (let pIdx = 0; pIdx < group.products.length; pIdx++) {
        const productData = group.products[pIdx];
        console.log(`  Seeding Product: ${productData.name}...`);
        
        const localPaths = [];
        for (let i = 0; i < productData.images.length; i++) {
          const filename = `${group.categoryName.toLowerCase()}_${pIdx}_${Date.now()}_${i}.png`;
          const filepath = path.join(uploadDir, filename);
          try {
            await downloadImage(productData.images[i], filepath);
            localPaths.push(`/uploads/products/${filename}`);
            console.log(`    -> Downloaded image ${i+1}`);
          } catch (e) {
            console.error(`    -> Failed to download image ${i+1}:`, e.message);
          }
        }

        if (localPaths.length > 0) {
          const newProduct = new Product({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock: 50 + (pIdx * 10),
            category: category._id,
            images: localPaths
          });

          await newProduct.save();
          console.log(`    Saved Product to DB: ${productData.name}`);
        }
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
};

seedProducts();
