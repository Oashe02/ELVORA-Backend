const express = require('express');
const router = express.Router();
const projectsController = require('../controller/projects');
const passport = require('passport');
// Public route to get all projects by siteName
router.get('/public-all/:siteName', projectsController.getAllPublicProjects);

// Public route to get a single project by slug
router.get('/public-single/:slug', projectsController.getSingleProject);

// Protected route to get all projects by siteName with authentication
router.get(
	'/all/:siteName',
	passport.authenticate('user-rule', { session: false }),
	projectsController.getAllProjects
);
// Route to create a new project
router.post(
	'/create',
	passport.authenticate('user-rule', { session: false }),
	projectsController.createProject
);
router.post(
	'/update/:id',
	passport.authenticate('user-rule', { session: false }),
	projectsController.updateProject
);

// Route to get a project by ID
router.get('/:id', projectsController.getProjectById);

// Route to update a project by ID
// router.put('/:id', projectsController.updateProject);

// Route to delete a project by ID
router.delete('/delete/:id', projectsController.deleteProject);

export default router;

