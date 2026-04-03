import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import Product from "../../models/Product.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.session.user;
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.productId',
      populate: { path: 'category' }
    });

    if (!cart) {
      cart = { items: [] };
    }

    const validItems = cart.items.filter(item => {
      const p = item.productId;
      return p && !p.isDeleted && p.category && !p.category.isDeleted;
    });

    const subtotal = validItems.reduce((acc, item) => acc + item.totalPrice, 0);

    res.render("user/cart", {
      layout: false,
      cart: { ...cart.toObject ? cart.toObject() : cart, items: validItems },
      subtotal,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity);

    const product = await Product.findById(productId).populate('category');
    if (!product || product.isDeleted || !product.category || product.category.isDeleted) {
      return res.status(400).json({ success: false, message: "Product is no longer available" });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
       cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;
      
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock.` });
      }

      if (newQty > 5) {
        return res.status(400).json({ success: false, message: "Maximum 5 units per product allowed in cart." });
      }

      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].totalPrice = newQty * product.price;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available.` });
      }
      if (qty > 5) {
        return res.status(400).json({ success: false, message: "Maximum 5 units allowed." });
      }

      cart.items.push({
        productId,
        quantity: qty,
        price: product.price,
        totalPrice: qty * product.price
      });
    }

    await cart.save();

    await Wishlist.updateOne(
      { user: userId },
      { $pull: { products: productId } }
    );

    res.json({ success: true, message: "Product added to cart!" });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, change } = req.body; 

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: "Item not found in cart" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const newQty = cart.items[itemIndex].quantity + change;

    if (newQty < 1) return res.status(400).json({ success: false, message: "Quantity cannot be less than 1" });
    
   
    if (newQty > 5) return res.status(400).json({ success: false, message: "Maximum 5 units allowed" });

    
    if (newQty > product.stock) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock" });
    }

    cart.items[itemIndex].quantity = newQty;
    cart.items[itemIndex].totalPrice = newQty * product.price;

    await cart.save();

    const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    res.json({ 
      success: true, 
      newQuantity: newQty, 
      itemTotal: cart.items[itemIndex].totalPrice,
      subtotal 
    });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;

    await Cart.updateOne(
      { user: userId },
      { $pull: { items: { productId } } }
    );

    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      populate: { path: 'category' }
    });

    res.render("user/wishlist", {
      layout: false,
      wishlist: wishlist || { products: [] },
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let message = "";
    if (index > -1) {
      wishlist.products.splice(index, 1);
      message = "Removed from wishlist";
    } else {
      wishlist.products.push(productId);
      message = "Added to wishlist";
    }

    await wishlist.save();
    res.json({ success: true, message });
  } catch (err) {
    console.error("Error toggling wishlist:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
