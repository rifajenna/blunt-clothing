import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    let query = { isDeleted: false };
    
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/pages/products", {
      title: "Products",
      showLayout: true,
      cssFile: "products.css",
      products,
      currentPage: page,
      totalPages,
      search,
      path: "/admin/products"
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).render("admin/pages/error", { title: "Error", message: "Failed to load products" });
  }
};

export const showAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    res.render("admin/pages/add-product", {
      title: "Add Product",
      showLayout: true,
      cssFile: "product-form.css",
      categories,
      path: "/admin/products"
    });
  } catch (err) {
    console.error("Error loading add product page:", err);
    res.redirect("/admin/products");
  }
};

export const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    
    if (!name || !price || !stock || !category) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ message: "Minimum 3 images are required" });
    }

    // Extract file paths to save in DB
    const imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);

    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      category: new mongoose.Types.ObjectId(category),
      images: imagePaths
    });

    await newProduct.save();

    res.status(201).json({ message: "Product added successfully", redirectUrl: "/admin/products" });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const showEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.isDeleted) {
      return res.redirect("/admin/products");
    }

    const categories = await Category.find({ isDeleted: false });
    
    res.render("admin/pages/edit-product", {
      title: "Edit Product",
      showLayout: true,
      cssFile: "product-form.css",
      product,
      categories,
      path: "/admin/products"
    });
  } catch (err) {
    console.error("Error loading edit product page:", err);
    res.redirect("/admin/products");
  }
};

export const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, stock, category, existingImages } = req.body;

    let imagesToKeep = [];
    if (existingImages) {
      imagesToKeep = Array.isArray(existingImages) ? existingImages : [existingImages];
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // New uploaded images
    const newImagePaths = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    const totalImagesCount = imagesToKeep.length + newImagePaths.length;
    
    if (totalImagesCount < 3) {
      return res.status(400).json({ message: "Minimum 3 images are required" });
    }

    // Identify images that were deleted to remove them from disk
    const imagesToDelete = product.images.filter(img => !imagesToKeep.includes(img));
    for (const imagePath of imagesToDelete) {
      const fullPath = path.join(process.cwd(), "public", imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Update product fields
    product.name = name;
    product.description = description;
    product.price = Number(price);
    product.stock = Number(stock);
    product.category = new mongoose.Types.ObjectId(category);
    product.images = [...imagesToKeep, ...newImagePaths];

    await product.save();

    res.status(200).json({ message: "Product updated successfully", redirectUrl: "/admin/products" });
  } catch (err) {
    console.error("Error editing product:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const softDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isDeleted = true;
    await product.save();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
