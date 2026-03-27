import Product from "../../models/Product.js";
import Category from "../../models/Category.js";

export const getShopPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const sort = req.query.sort || "featured";
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    
    let selectedCategories = [];
    if (req.query.category) {
      if (Array.isArray(req.query.category)) {
        selectedCategories = req.query.category;
      } else {
        selectedCategories = [req.query.category];
      }
    }

    const categories = await Category.find({ isDeleted: false });

    const activeCategoryIds = categories.map(cat => cat._id.toString());
    
    let query = {
      isDeleted: false,
      category: { $in: activeCategoryIds }
    };

    // If specific categories selected in filter, intersect them
    if (selectedCategories.length > 0) {
      query.category = { $in: selectedCategories.filter(id => activeCategoryIds.includes(id)) };
    }

    // Search query
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Price query
    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    let sortConfig = { createdAt: -1 };
    if (sort === "price-asc") {
      sortConfig = { price: 1 };
    } else if (sort === "price-desc") {
      sortConfig = { price: -1 };
    } else if (sort === "name-asc") {
      sortConfig = { name: 1 };
    } else if (sort === "name-desc") {
      sortConfig = { name: -1 };
    }

    // Fetch total matching products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch paginated and sorted products
    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortConfig)
      .skip(skip)
      .limit(limit);

    res.render("user/shop", {
      layout: false,
      products,
      categories,
      totalProducts,
      currentPage: page,
      totalPages,
      search,
      sort,
      selectedCategories,
      minPrice,
      maxPrice,
      user: req.session.user || req.user || null
    });

  } catch (err) {
    console.error("Error fetching shop page:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    // Fetch the product natively
    const product = await Product.findById(productId).populate("category");

    if (!product || product.isDeleted || !product.category || product.category.isDeleted) {
      return res.redirect("/user/shop");
    }

    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isDeleted: false
    })
    .limit(4)
    .populate("category");

    res.render("user/product-details", {
      layout: false,
      product,
      relatedProducts,
      user: req.session.user || req.user || null
    });

  } catch (err) {
    console.error("Error fetching product details:", err);
    res.redirect("/user/shop");
  }
};
