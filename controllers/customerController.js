import Customer from '../models/Customer.js';

export const createCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;
  try {
    const customer = new Customer({
      name,
      email,
      address,
      phone,
      store: req.user.store
    });
    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ store: req.user.store });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, store: req.user.store })
      .populate({
        path: 'purchases.saleId',
        model: 'Sale'
      });
    console.log('Fetched customer:', customer);
    if (customer) {
      console.log('Customer purchases:', customer.purchases);
    }
    let purchases = [];
    if (customer && customer.purchases && customer.purchases.length > 0) {
      purchases = customer.purchases.map(p => p.saleId).filter(Boolean);
    }
    console.log(customer.purchases)
    if (customer) res.json(customer);
    else res.status(404).json({ message: 'Customer not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  const { name, contact, email, address } = req.body;
  try {
    const customer = await Customer.findOne({ _id: req.params.id, store: req.user.store });
    if (customer) {
      customer.name = name || customer.name;
      customer.contact = contact || customer.contact;
      customer.email = email || customer.email;
      customer.address = address || customer.address;

      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    console.log("delete customer "+ req.params.id)
    const customer = await Customer.findOne({ _id: req.params.id, store: req.user.store });
    if (customer) {
      await customer.deleteOne();
      res.json({ message: 'Customer deleted' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerPurchases = async (req, res) => {
  const customerId = req.params.id;
  try {
    const purchases = await Sale.find({ _id: req.params.id, store: req.user.store })
      .populate('customer', 'name email contact')
      .populate('products.product', 'name price')
      .sort({createdAt: -1});
    if (purchases.length === 0) {
      return res.status(404).json({ message: 'No purchases found for this customer' });
    }
    res.json(purchases);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
}