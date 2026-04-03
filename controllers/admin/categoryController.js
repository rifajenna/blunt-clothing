import Category from "../../models/Category.js";
import { sendResponse } from "../../utils/sendResponse.js";

export const getCategories = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const query = {
      isDeleted: false,
      name: { $regex: search, $options: "i" },
    };

    const totalCategories = await Category.countDocuments(query);

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("admin/pages/categories", {
      title: "Categories",
      showLayout: true,
      cssFile: "categories.css", 
      categories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
      search,
      pageJS: "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

export const showAddCategory = (req, res) => {
  res.render("admin/pages/add-category", {
    title: "Add Category",
    showLayout: true,
    cssFile: "category-form.css",
    pageJS: "",
  });
};

export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existingCategory) {
      if (existingCategory.isDeleted) {
        return sendResponse(res, { code: 400, message: "A deleted category with exactly this name already exists." });
      }
      return sendResponse(res, { code: 400, message: "Category with this name already exists." });
    }

    await Category.create({ name, description });

    return sendResponse(res, {
      code: 200,
      message: "Category created successfully",
      redirectUrl: "/admin/categories",
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendResponse(res, { code: 400, message: "Category with this name already exists." });
    }
    return sendResponse(res, { code: 500, message: "Internal server error" });
  }
};


export const showEditCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category || category.isDeleted) {
      return res.redirect("/admin/categories");
    }

    res.render("admin/pages/edit-category", {
      title: "Edit Category",
      showLayout: true,
      cssFile: "category-form.css",
      category,
      pageJS: "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

export const editCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category || category.isDeleted) {
      return sendResponse(res, { code: 404, message: "Category not found" });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: categoryId }
    });

    if (existingCategory) {
      return sendResponse(res, { code: 400, message: "Another category with this name already exists." });
    }

    category.name = name;
    category.description = description;
    await category.save();

    return sendResponse(res, {
      code: 200,
      message: "Category updated successfully",
      redirectUrl: "/admin/categories",
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendResponse(res, { code: 400, message: "Another category with this name already exists." });
    }
    return sendResponse(res, { code: 500, message: "Internal server error" });
  }
};


export const softDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category || category.isDeleted) {
      return sendResponse(res, { code: 404, message: "Category not found or already deleted" });
    }

    category.isDeleted = true;
    await category.save();

    return sendResponse(res, {
      code: 200,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, { code: 500, message: "Server error" });
  }
};
