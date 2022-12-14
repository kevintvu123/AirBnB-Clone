const express = require('express')

const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateReviewEdit = [
    check('review')
        .exists({ checkFalsy: true })
        .withMessage('Review text is required'),
    check('stars')
        .exists({ checkFalsy: true })
        .isInt({ min: 1, max: 5 })
        .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
];

const reqAuthorization = async (req, res, next) => { //middleware to authorize that review exists and user owns review
    const { reviewId } = req.params //assumes reviewId is parameter
    const { user } = req //assumes user was authenticated
    const userId = user.toJSON().id

    const findReview = await Review.findByPk(reviewId, { //finds review and returns the userId
        attributes: ['userId']
    })

    if (!findReview) {   //Error for non-existent spot
        const err = new Error("Review couldn't be found");
        err.status = 404
        return next(err);
    }

    const ownerId = findReview.toJSON().userId

    if (ownerId === userId) {
        return next()
    } else {    //Error for unauthorized user
        const err = Error("Forbidden");
        err.status = 403
        return next(err);
    }
}

const reviewImageCounter = async (req, res, next) => { //middleware to count review images (necessary due to async behavior)
    const { reviewId } = req.params

    const countImages = await ReviewImage.count({
        where: {
            reviewId: reviewId
        }
    })

    if (countImages >= 10) {
        const err = Error('Maximum number of images for this resource was reached')
        err.status = 403
        return next(err)
    } else {
        next()
    }
}

//Delete a Review
router.delete('/:reviewId', requireAuth, reqAuthorization, async (req, res, next) => {
    const { reviewId } = req.params

    const findReview = await Review.findByPk(reviewId)
    await findReview.destroy()

    res.json({
        message: "Successfully deleted",
        statusCode: 200
    })
})

//Edit a Review
router.put('/:reviewId', requireAuth, reqAuthorization, validateReviewEdit, async (req, res) => {
    const { reviewId } = req.params
    const { review, stars } = req.body

    const findReview = await Review.findByPk(reviewId)
    findReview.set({
        review: review,
        stars: stars
    })
    await findReview.save()

    res.json(findReview)
})

//Add Image to Review 
router.post('/:reviewId/images', requireAuth, reqAuthorization, reviewImageCounter, async (req, res, next) => {
    const { reviewId } = req.params
    const { url } = req.body

    const newImage = await ReviewImage.create({
        reviewId: reviewId,
        url: url
    })

    const newImageDetails = newImage.toJSON()

    res.json({
        id: newImageDetails.id,
        url: url
    })
})

//Get all Reviews of the Current User
router.get('/current', requireAuth, async (req, res) => {
    const { user } = req
    const userId = user.id

    const findReviews = await Review.findAll({
        where: {
            userId: userId
        }
    })

    const payload = []
    for (let i = 0; i < findReviews.length; i++) {
        const review = findReviews[i]

        const user = await review.getUser({
            attributes: {
                exclude: ['username']
            }
        })

        const spot = await review.getSpot({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'description']
            }
        })

        let spotImage = await SpotImage.findOne({      //finds the first image that has a truthy preview
            where: {
                preview: true,
                spotId: spot.id
            }
        })
        spotImage ? spotImage = spotImage.url : null
        spot.dataValues.previewImage = spotImage

        const reviewImages = await review.getReviewImages({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'reviewId']
            }
        })

        const reviewData = {
            id: review.id,
            userId: review.userId,
            spotId: review.spotId,
            review: review.review,
            stars: review.stars,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            User: user,
            Spot: spot,
            ReviewImages: reviewImages
        }
        payload.push(reviewData)

    }

    res.json({
        Reviews: payload
    })
})

module.exports = router;