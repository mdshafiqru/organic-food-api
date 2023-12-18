const mongoose = require('mongoose');

const Category = require('../../models/common/category');
const Slider = require('../../models/common/slider');
const Product = require('../../models/common/product');
const Division = require('../../models/common/division');
const AppInfo = require('../../models/common/app_info');

const getCategories = async (req, res) => {
    
    try {

      const categories = await Category.find();

      return res.status(200).json(categories);

    } catch (error) {
      return res.status(500).json({message: error.message, success: false});
    }
}

const getSliders = async (req, res) => {
    
    try {

      const result = await Slider.find();

      return res.status(200).json(result);

    } catch (error) {
      return res.status(500).json({message: error.message, success: false});
    }
}


const allProducts = async (req, res) => {
  
    try {

      const skip = req.params.skip;
  
      if(skip){
        const skipInt = parseInt(skip, 10);
        
        if (isNaN(skipInt)) {
          return res.status(400).json({message: "skip should be a number", success: false});
        }
        const limit = 10;

        const pipeline = [

          {
            $skip: skipInt ?? 0
          },
  
          {
            $limit: limit 
          },

          {
              $lookup: {
                  from: "categories",              
                  localField: "categoryId",       
                  foreignField: "_id",          
                  as: "category"              
              }
          },
  
        ]
  
        
        const result = await Product.aggregate(pipeline).exec();
  
        return res.status(200).json(result);
  
      } else {
        return res.status(400).json({message: "Unknown query parameter used", success: false});
      }
    
    } catch (error) {
      return res.status(500).json({message: error.message, success: false});
    }

}

const productsByCategory = async (req, res) => {
  
    try {

      const categoryId = req.params.categoryId;
      const skip = req.params.skip;

      const category = await Category.findOne({_id: categoryId});

      if(!category){
        return res.status(400).json({message: "Invalid Category ID", success: false});
      }
  
      if(skip){
        const skipInt = parseInt(skip, 10);
        
        if (isNaN(skipInt)) {
          return res.status(400).json({message: "skip should be a number", success: false});
        }
        const limit = 10;

        const pipeline = [

          {
            $match: {
              categoryId: new mongoose.Types.ObjectId(categoryId) , // Convert userId to ObjectId
            },
          },

          {
            $skip: skipInt ?? 0
          },
  
          {
            $limit: limit 
          },

          {
            $lookup: {
                from: "categories",              
                localField: "categoryId",       
                foreignField: "_id",          
                as: "category"              
            }
          },
  
        ]
  
        
        const result = await Product.aggregate(pipeline).exec();
  
        return res.status(200).json(result);
  
      } else {
        return res.status(400).json({message: "Unknown query parameter used", success: false});
      }
    
    } catch (error) {
      return res.status(500).json({message: error.message, success: false});
    }

}



const searchProducts = async (req, res) => {
    
  try {
      
      const query = req.params.query;

      const pipeline = [
        {
          $match: {
            name: { $regex: query, $options: 'i' }
          }
        },

        {
          $lookup: {
              from: "categories",              
              localField: "categoryId",       
              foreignField: "_id",          
              as: "category"              
          }
        },

      ];

      const result = await Product.aggregate(pipeline).exec();

      return res.status(200).json(result);

  } catch (error) {
      return res.status(500).json({message: error.message, success: false });
  }

}

const getDivisions = async (req, res) => {
    
  try {

      const result = await Division.find();

      return res.status(200).json(result);

  } catch (error) {
      return res.status(500).json({message: error.message, success: false});
  }
}

const getAppInfo = async (req, res) => {

  try {

      const appInfo = await AppInfo.findOne({});
      
      return res.status(200).json(appInfo);

  } catch (error) {
      return res.status(500).json({message: error.message, success: false});
  }
}

module.exports = {
    getCategories,
    getSliders,
    allProducts,
    productsByCategory,
    searchProducts,
    getDivisions,
    getAppInfo,
}