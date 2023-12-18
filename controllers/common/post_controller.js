const User = require('../../models/user/user');
const Post = require('../../models/common/post');
const Comment = require('../../models/common/comment');
const Reply = require('../../models/common/reply');
const fs = require('fs');
const Category = require('../../models/common/category');




const createPost = async (req, res)=> {

    try {

        const {title, description, categoryId} = req.body;

        const post = await Post.create({title, description, user: req.userId, category: categoryId});

        const user = await User.findOne({_id: req.userId});

        if(user){
            user.posts.push(post._id);
            await user.save();
        }

        let index = 0;

        req.files.forEach(file => {
            
            const filePath = `uploads/post_images/${file.filename}`;

            if(index === 0){
                post.thumbnail = filePath;
            }
            else {
                post.images.push(filePath);
            }

            index++;

        });

        post.save();

       return res.status(200).json({message: "Post created successfully!", success: true, postCount: user.posts.length});

        
    } catch (error) {

        deleteFiles(req.files);
        return res.status(500).json({message: error.message, success: false});
    }
}


const editPost = async (req, res) => {
    const {title, description, categoryId, postId, deletedThumbnail} = req.body;
    
    const deletedImages =  JSON.parse(req.body.deletedImages);

    
    try {

        const post = await Post.findOne({_id: postId, isDeleted: false});

        if(post){

            if(post.user != req.userId){
                deleteFiles(req.files);
                return res.status(400).json({message: "You don't have permission to edit this post.", success: false});
            }

            const category = await Category.findOne({_id: categoryId, isActive: true});

            if(category){

                post.title = title;
                post.description = description;
                post.category = categoryId;

                let index = 0;

                if(deletedThumbnail != undefined) {
                    if(deletedThumbnail.length > 0){

                        req.files.forEach(file => {
                        
                            const filePath = `uploads/post_images/${file.filename}`;
        
                            if(index === 0){
                                post.thumbnail = filePath;
                            }
                            else {
                                post.images.push(filePath);
                            }
        
                            index++;
        
                        });
                       
                    } else {
                        req.files.forEach(file => {
                        
                            const filePath = `uploads/post_images/${file.filename}`;
        
                            post.images.push(filePath);
        
                            index++;
        
                        });
                    }
                }
                else {
                    req.files.forEach(file => {
                    
                        const filePath = `uploads/post_images/${file.filename}`;
    
                        post.images.push(filePath);
    
                        index++;
    
                    });
                }

                if(deletedThumbnail != undefined) {
                    if(deletedThumbnail.length > 0){ 
                        const filePath = 'public/' + deletedThumbnail;
    
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
                }

              
                if(deletedImages != undefined){
                    if(deletedImages.length > 0){

                        for (let i = 0; i < deletedImages.length; i++) {
                            const img = deletedImages[i];
    
                            post.images.remove(img);
    
                            const filePath = 'public/' + img;
    
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
                    }
                }
                
                await post.save();

                return res.status(200).json({message: 'Post updated successfully!', success: true});

            } else {
                deleteFiles(req.files);
                return res.status(400).json({message: 'Category not found or this category is not active', success: false});
            }

        } else {
            deleteFiles(req.files);
            return res.status(400).json({message: 'Post not found or this post is already in trash.', success: false});
        }
        
    } catch (error) {
        deleteFiles(req.files);
        return res.status(500).json({message: error.message, success: false});
    }

}

const deleteFiles = (files) => {
    files.forEach(file => {

        const filePath = `public/uploads/post_images/${file.filename}`;
        
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


const getPosts = async (req, res)=> {
    try {
        const posts = await Post.find({isDeleted : false})
                                .sort({createdAt: 'desc'})
                                .select('-isDeleted -updatedAt -__v')
                                .populate('user', 'name avatar _id shortBio posts')
                                .populate('category', '_id name')
                                .exec();
        
        posts.forEach((post) => {
            const likeCount = post.likes.length;
            const commentCount = post.comments.length;
            const isLiked = post.likes.includes(req.userId);

            post.likes = undefined;
            post.comments = undefined;
            post.likeCount = likeCount;
            post.commentCount = commentCount;
            post.isLiked = isLiked;
        });


        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const getPostsByCategory = async (req, res) => {
    try {
        
        const category = await Category.findOne({_id: req.params.categoryId, isActive: true});

        if(!category){
            return res.status(400).json({message: 'category not found', success: false});
        }

        const posts = await Post.find({category: req.params.categoryId , isDeleted : false})
                                .sort({createdAt: 'desc'})
                                .select('-isDeleted -updatedAt -__v')
                                .populate('user', 'name avatar _id shortBio posts')
                                .populate('category', '_id name')
                                .exec();
        
        posts.forEach((post) => {
            const likeCount = post.likes.length;
            const commentCount = post.comments.length;
            const isLiked = post.likes.includes(req.userId);

            post.likes = undefined;
            post.comments = undefined;
            post.likeCount = likeCount;
            post.commentCount = commentCount;
            post.isLiked = isLiked;
        });


       return res.status(200).json(posts);
    } catch (error) {
       return res.status(500).json({message: error.message, success: false});
    }
}

const myPosts = async (req, res)=> {
    try {
        const posts = await Post.find({user: req.userId, isDeleted : false})
                                .sort({createdAt: 'desc'})
                                .select('-isDeleted -updatedAt -__v')
                                .populate('user', 'name avatar _id shortBio ')
                                .populate('category', '_id name')
                                .exec();

        posts.forEach((post) => {
            const likeCount = post.likes.length;
            const commentCount = post.comments.length;
            const isLiked = post.likes.includes(req.userId);

            post.likes = undefined;
            post.comments = undefined;
            post.likeCount = likeCount;
            post.commentCount = commentCount;
            post.isLiked = isLiked;
        });

        

        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


const deletePost = async (req, res) => {
    try {
        
        const post = await Post.findOne({_id: req.params.postId});

        const user = await User.findOne({_id: req.userId});

        if(user){

            if(post){

                if(user.role === 'user'){
                    if(post.user != req.userId){
                        return res.status(400).json({message: "You don't have permission to delete this post.", success: false});
                    } else {
                        post.isDeleted = true;
                        await post.save();

                        return res.status(200).json({message: "post deleted", success: true });
                    }
                }
                else if(user.role === 'admin') {

                    post.isDeleted = true;
                    await post.save();
        
                    return res.status(200).json({message: "post deleted", success: true });
        
                }

            } else {
                return res.status(400).json({message: "post not found", success: false });
            }

        } else {
            return res.status(401).json({message: "User not found.", success: false}); 
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}
const restorePost = async (req, res) => {
    try {
        
        const post = await Post.findOne({_id: req.params.postId});

        const user = await User.findOne({_id: req.userId});

        if(user){

            if(post){

                if(user.role === 'user'){
                    if(post.user != req.userId){
                        return res.status(400).json({message: "You don't have permission to restore this post.", success: false});
                    } else {
                        post.isDeleted = false;
                        await post.save();

                        return res.status(200).json({message: "Post Restored Successfully!", success: true });
                    }
                }
                else if(user.role === 'admin') {

                    post.isDeleted = false;
                    await post.save();
        
                    return res.status(200).json({message: "Post Restored Successfully!", success: true });
        
                }

            } else {
                return res.status(400).json({message: "post not found", success: false });
            }

        } else {
            return res.status(401).json({message: "User not found.", success: false}); 
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}

const deletePostPermanent = async (req, res) => {
    try {

        const post = await Post.findOne({_id: req.params.postId});

        const user = await User.findOne({_id: req.userId});

        if(!user){
            return res.status(401).json({message: "user not found", success: false });
        }
        
        if(user.role === 'user'){
            if(post.user != req.userId){
                return res.status(400).json({message: "You don't have permission to delete this post.", success: false});
            }
        }


        if(post){

            // // delete post from user
            const postUser = await User.findOne({_id: post.user});

            if(postUser){
                postUser.posts.remove(post._id);
                postUser.savedPosts.remove(post._id);
                await postUser.save();
            }

            // delete post image
            const thumbnail = `public/${post.thumbnail}`;

            if(fs.existsSync(thumbnail)){
                fs.unlink(
                    thumbnail,
                    (err) =>  {
                        if(err){
                            console.log(err.message)
                        }
                    }
                );
            }

            post.images.forEach(image => {
                const filePath = `public/${image}`;
        
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

            
            // delete comments

            const comments = await Comment.find({post: post._id});
            comments.forEach( async (comment) => {

                const commentUser = await User.findOne({_id: comment.user});
                
                commentUser.comments.remove(comment._id);
                await commentUser.save();

                const replies = await Reply.find({comment: comment._id});
                replies.forEach(async (reply) => {

                    const replyUser = await User.findOne({_id: reply.user});

                    replyUser.replies.remove(reply._id);
                    await replyUser.save();
                    await Reply.deleteOne({_id: reply._id});
                });

                await Comment.deleteOne({_id: comment._id});

            });

            // // delete post
            await Post.deleteOne({_id: post._id});

           
            return res.status(200).json({message: "post deleted successfully!", success: true });

        } else {
            return res.status(400).json({message: "post not found", success: false });
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}

const addSavePost = async (req, res) => {

    try {
        const post = await Post.findOne({_id: req.params.postId});

        if(post){

            if(post.user != req.userId){

                const user = await User.findOne({_id: req.userId});

                if(!user){
                    return res.status(401).json({message: "user not found", success: false });
                }

                if(!user.savedPosts.includes(post._id)){

                    user.savedPosts.push(post._id);
                    await user.save();

                    return res.status(200).json({message: "post saved", success: true });

                } else {
                    return res.status(400).json({message: "post already saved", success: false });
                }

            } else {
                return res.status(400).json({message: "You can not save your own post", success: false });
            }

        } else {
            return res.status(400).json({message: "post not found", success: false });
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}

const getSavedPosts = async (req, res) => {
    try {

        const user = await User.findOne({_id: req.userId});

        if(user){

            let posts = [];

            const startIndex = user.savedPosts.length - 1;

            for (let i = startIndex; i >= 0 ; i--) {
                const postId = user.savedPosts[i];

                const post = await Post.findOne({_id: postId, isDeleted: false})
                                .select('-isDeleted -updatedAt -__v')
                                .populate('user', 'name avatar _id shortBio')
                                .populate('category', '_id name')
                                .exec();

                if(post){

                    const likeCount = post.likes.length;
                    const commentCount = post.comments.length;
                    const isLiked = post.likes.includes(req.userId);

                    post.likes = undefined;
                    post.comments = undefined;
                    post.likeCount = likeCount;
                    post.commentCount = commentCount;
                    post.isLiked = isLiked;
                    
                    posts.push(post);

                }
                
            }

            return res.status(200).json(posts);

        } else {
            return res.status(401).json({message: "user not found", success: false });
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}


const getDeletedPosts = async (req, res)=> {
    try {
        const posts = await Post.find({user: req.userId, isDeleted : true})
                                .sort({createdAt: 'desc'})
                                .select('-isDeleted -updatedAt -__v')
                                .populate('user', 'name avatar _id shortBio posts')
                                .populate('category', '_id name')
                                .exec();

        posts.forEach((post) => {
            const likeCount = post.likes.length;
            const commentCount = post.comments.length;
            const isLiked = post.likes.includes(req.userId);

            post.likes = undefined;
            post.comments = undefined;
            post.likeCount = likeCount;
            post.commentCount = commentCount;
            post.isLiked = isLiked;
        });

        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const removeSavedPost = async (req, res) => {
    try {

        const post = await Post.findOne({_id: req.params.postId});

        if(post){

            const user = await User.findOne({_id: req.userId});

            if(user){

                user.savedPosts.remove(post._id);
                await user.save();

                return res.status(200).json({message: "post removed.", success: true });

            } else {
                return res.status(401).json({message: "user not found", success: false });
            }

        } else {
            return res.status(401).json({message: "post not found", success: false });
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}

const searchPosts = async (req, res) => {
    
    try {
        
        const query = req.params.query;

        const posts = await Post.find({
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } }
            ]
        }).sort({createdAt: 'desc'})
        .select('-isDeleted -updatedAt -__v')
        .populate('user', 'name avatar _id shortBio posts')
        .populate('category', '_id name')
        .exec();

        posts.forEach((post) => {
            const likeCount = post.likes.length;
            const commentCount = post.comments.length;
            const isLiked = post.likes.includes(req.userId);

            post.likes = undefined;
            post.comments = undefined;
            post.likeCount = likeCount;
            post.commentCount = commentCount;
            post.isLiked = isLiked;
        });

        return res.status(200).json(posts);

    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }

}

const getPostsByAuthor = async (req, res) => {
    try {
        
        const author = await User.findOne({_id: req.params.authorId}).select('name email avatar shortBio posts isBlocked _id').exec();

        if(author){

            const posts = await Post.find({user: author._id, isDeleted: false})
                                .sort({createdAt: 'desc'})
                                .select('-isDeleted -updatedAt -__v')
                                .populate('user', 'name avatar _id shortBio')
                                .populate('category', '_id name')
                                .exec();

            posts.forEach((post) => {
                const likeCount = post.likes.length;
                const commentCount = post.comments.length;
                const isLiked = post.likes.includes(req.userId);

                post.likes = undefined;
                post.comments = undefined;
                post.likeCount = likeCount;
                post.commentCount = commentCount;
                post.isLiked = isLiked;
            });

            author.postsCount = author.posts.length;
            author.posts = undefined;

            return res.status(200).json({author, posts});

        } else {
            return res.status(400).json({message: "Author not found", success: false });
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false });
    }
}

module.exports = {
    getPosts,
    getPostsByCategory,
    myPosts,
    createPost,
    editPost,
    deletePost,
    restorePost,
    deletePostPermanent,
    addSavePost,
    getSavedPosts,
    removeSavedPost,
    searchPosts,
    getDeletedPosts,
    getPostsByAuthor,
}