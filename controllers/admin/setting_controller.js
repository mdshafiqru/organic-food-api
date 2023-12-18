

const Category = require('../../models/common/category');
const Product = require('../../models/common/product');
const Slider = require('../../models/common/slider');
const Division = require('../../models/common/division');
const fs = require('fs');
const AppInfo = require('../../models/common/app_info');

const createDivision = async (req, res) => {
    let {name, deliveryCharge} = req.body;
    
    try {
        const existingDivision = await Division.findOne({ name });
    
        if(existingDivision){
            return res.status(400).json({message:"Division already exists with this name", success: false});
        }

        const division = await Division.create({name, deliveryCharge});

        return res.status(200).json({message:"Division created Successfully", success: true});

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
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


const deleteDivision = async (req, res) => {
    
    const id = req.params.id;

    try {

        const division = await Division.findOne({_id: id});

        if(division){

            await Division.deleteOne({_id: id});
            return res.status(200).json({message: "Division Deleted Successfully", success: true});

        } else {
            return res.status(400).json({message: "Division Not Found", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const editDivision = async (req, res) => {
    

    let {id, name, deliveryCharge} = req.body;

    try {

        const division = await Division.findOne({_id: id});

        if(division){

            division.name = name;
            division.deliveryCharge = deliveryCharge;
            await division.save();

            return res.status(200).json({message: "Division Updated Successfully", success: true, division});

        } else {
            return res.status(400).json({message: "Division Not Found", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const createSlider = async (req, res) => {
  
    try {

        const uploadedFile = req.files[0];

        if(!uploadedFile){
            return res.status(200).json({message: "Image is required", success: false});
        }

        const imagePath = `uploads/sliders/${uploadedFile.filename}`;

        const slider = await Slider.create({image: imagePath});

        return res.status(200).json({message: "Slider created successfully!", success: true, slider});

        
    } catch (error) {

        deleteFiles(req.files);
        return res.status(500).json({message: error.message, success: false});
    }
}

const allSliders = async (req, res) => {
    
    try {

        const sliders = await Slider.find();

        return res.status(200).json(sliders);

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const deleteSlider = async (req, res) => {
  
    try {

        const id = req.params.id;

        const slider = await Slider.findOne({_id: id});

        if(!slider){
         
            return res.status(400).json({message: "Slider Not Found", success: false});
        }

        deleteSingleFile(slider.image);

        await Slider.deleteOne({_id: id});
        return res.status(200).json({message: "Slider Deleted Successfully", success: true});


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

const createAppInfo = async (req, res) => {
    let {email, about, terms, privacy } = req.body;
    
    try {

        // const info = await AppInfo.create({email, about, terms, privacy});

        return res.status(200).json({message:"App Info created Successfully", success: true});

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
    createSlider,
    allSliders,
    deleteSlider,
    createDivision,
    getDivisions,
    deleteDivision,
    editDivision,
    createAppInfo,
    getAppInfo,
}