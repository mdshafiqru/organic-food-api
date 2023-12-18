

const Category = require('../../models/common/category');

const createCategory = async (req, res) => {
    let {name} = req.body;
    
    try {
        const existingCategory = await Category.findOne({ name });
    
        if(existingCategory){
            return res.status(400).json({message:"Category already exists with this name", success: false});
        }

        const category = await Category.create({name});

        return res.status(200).json({message:"Category created Successfully", success: true});

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const getCategories = async (req, res) => {
    
    
    try {

        const categories = await Category.find();

        return res.status(200).json(categories);

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const deleteCategory = async (req, res) => {
    
    const id = req.params.id;

    try {

        const category = await Category.findOne({_id: id});

        if(category){

            await Category.deleteOne({_id: id});
            return res.status(200).json({message: "Category Deleted Successfully", success: true});

        } else {
            return res.status(400).json({message: "Category Not Found", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}



module.exports = {
    createCategory,
    getCategories,
    deleteCategory,
}