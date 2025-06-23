import Product from "../models/Product.js";

export const createProduct = async (req,res)=>{
    const {name,description,price,image,category,stock}= req.body;

    try{

        const product = await Product.create({
            name,
            description,
            price,
            image,
            category,
            stock
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);

    }catch(error){
        res.status(500).json({message:error.message});
    }
}

export const getProducts = async (req, res) => {
    try {
      console.log('fetch kar raha product')
      const products = await Product.find({});
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (product) res.json(product);
      else res.status(404).json({ message: 'Product not found' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

export const productByName = async (req, res) => {
    try {
        console.log('Search API hit!');
        console.log('Full request query:', req.query);
        console.log('Full request path:', req.path);
        
        const { name } = req.query;
        
        if (!name || name.trim() === '') {
            console.log('No name parameter provided');
            return res.status(400).json({ message: 'Name query parameter is required' });
        }
        
        console.log(`Searching for product with name: ${name}`);
        
        const searchQuery = {
            name: { $regex: name, $options: 'i' }
        };
        
        console.log('Search query:', searchQuery);
        
        const products = await Product.find(searchQuery);
        
        console.log('MongoDB query executed');
        console.log('Products found:', products);
        
        if (products.length > 0) {
            return res.json(products);
        } else {
            console.log('No products found for search term:', name);
            return res.status(404).json({ message: 'No products found' });
        }
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: error.message });
    }
}

export const updateProduct = async (req, res) => {
    const { name, description, price, stock, category } = req.body;
    try {
      const product = await Product.findById(req.params.id);
      if (product) {
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.stock = stock || product.stock;
        product.category = category || product.category;
  
        const updatedProduct = await product.save();
        res.json(updatedProduct);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };


export const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };