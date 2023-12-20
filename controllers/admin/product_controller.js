

const Category = require('../../models/common/category');
const Product = require('../../models/common/product');
const fs = require('fs');

const createProduct = async (req, res) => {
  
    try {

        const {name, size, categoryId, shortDesc, longDesc, price} = req.body;

        const category = await Category.findOne({ _id: categoryId });

        if(!category){
            deleteFiles(req.files);
            return res.status(400).json({message: "Category Not Found", success: false});
        }

        const uploadedFile = req.files[0];
        let imagePath = "";

        if(uploadedFile){
            imagePath = `uploads/product_image/${uploadedFile.filename}`;
        }

        const product = await Product.create({name, size, image: imagePath, categoryId, shortDesc, longDesc, price});

        return res.status(200).json({message: "Product created successfully!", success: true});

        
    } catch (error) {

        deleteFiles(req.files);
        return res.status(500).json({message: error.message, success: false});
    }
}

const editProduct = async (req, res) => {
  
    try {

        const {id} = req.body;

        const product = await Product.findOne({_id: id});

        if(!product){
            deleteFiles(req.files);
            return res.status(400).json({message: "Product Not Found", success: false});
        }

        const {name, size, categoryId, shortDesc, longDesc, price, oldImage} = req.body;

        const category = await Category.findOne({ _id: categoryId });

        if(!category){
            deleteFiles(req.files);
            return res.status(400).json({message: "Category Not Found", success: false});
        }

        const uploadedFile = req.files[0];
        
        if(uploadedFile){
            const imagePath = `uploads/product_image/${uploadedFile.filename}`;
            deleteSingleFile(oldImage);
            product.image = imagePath;
        } 

        product.name = name;
        product.size = size;
       
        product.categoryId = categoryId;
        product.shortDesc = shortDesc;
        product.longDesc = longDesc;
        product.price = price;

        await product.save();

        return res.status(200).json({message: "Product Updated successfully!", success: true});

        
    } catch (error) {

        deleteFiles(req.files);
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
 
          const pipeline = [

            {
              $skip: skipInt ?? 0
            },
    
            {
                $lookup: {
                    from: "categories",               
                    localField: "categoryId",       
                    foreignField: "_id",          
                    as: "category"              
                }
            },

            {
                $unwind: "$category"
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

const deleteProduct = async (req, res) => {
  
    try {

        const id = req.params.id;

        const product = await Product.findOne({_id: id});

        if(!product){
         
            return res.status(400).json({message: "Product Not Found", success: false});
        }

        deleteSingleFile(product.image);

        await Product.deleteOne({_id: id});
        return res.status(200).json({message: "Product Deleted Successfully", success: true});


    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


const deleteFiles = (files) => {
    files.forEach(file => {

        const filePath = `public/uploads/product_image/${file.filename}`;
        
        if(fs.existsSync(filePath)){
            fs.unlink(
                filePath,
                (err) =>  {
                    if(err){
                        console.log(err.message)
                    }
                }
            );
        }
    
    });
}

const deleteSingleFile = (path) => {
    const filePath = `public/${path}`;
        
    if(fs.existsSync(filePath)){
        fs.unlink(
            filePath,
            (err) =>  {
                if(err){
                    console.log(err.message)
                }
            }
        );
    }
}

module.exports = {
    createProduct,
    editProduct,
    allProducts,
    deleteProduct,
}