const Projects = require('../model/Projects');

export const getAllPublicProjects = async (req, res) => {
	try {
		const projects = await Projects.find(
			{ siteName: req.params.siteName },
			'type homepageProject featuredProject project fourDhomepage fourDfeature'
		)
			.sort({ createdAt: -1 })
			.exec();

		const transformData = (data) => {
			const result = {
				homepageProject: [],
				featuredProject: [],
				fourDfeature: [],
				fourDhomepage: [],
				projectsData: {},
			};

			for (let item of data) {
				// Check for homepageProject and featuredProject
				if (item.type === 'homepage' && item.homepageProject) {
					result.homepageProject.push(item.homepageProject);
				} else if (item.type === 'fourDfeature' && item.fourDfeature) {
					result.fourDfeature.push(item.fourDfeature);
				} else if (item.type === 'fourDhomepage' && item.fourDhomepage) {
					result.fourDhomepage.push(item.fourDhomepage);
				} else if (item.type === 'featured' && item.featuredProject) {
					result.featuredProject.push(item.featuredProject);
				} else if (item.type === 'projects' && item.project) {
					const projectType = item.project.type; // Get the type from the project object
					// Initialize the project type array if it doesn't exist
					if (!result.projectsData[projectType]) {
						result.projectsData[projectType] = [];
					}
					// Push the project into the corresponding type array
					result.projectsData[projectType].push(item.project);
				}
			}

			return result;
		};

		// Transform the data
		const transformedData = transformData(projects);

		console.log(transformedData);

		return res.json({
			error: false,
			message: 'Projects fetched successfully',
			payload: transformedData,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: true,
			message: 'Something went wrong, please try again later.',
		});
	}
};

// Public route: Get a single project by slug
export const getSingleProject = async (req, res) => {
	try {
		const project = await Projects.findOne({
			'fourDfeature.link': req.params.slug,
		});
		console.log({ project });

		if (!project) {
			return res.json({ error: true, message: 'No project found' });
		}

		return res.json({
			error: false,
			message: 'Project found',
			payload: project,
		});
	} catch (error) {
		console.error(error);
		return res.json({
			error: true,
			message: 'Something went wrong, please try again later.',
		});
	}
};

// Protected route: Get all projects by siteName with pagination
export const getAllProjects = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 300;
		const skip = (page - 1) * limit;

		const projects = await Projects.aggregate([
			{ $match: { siteName: req.params.siteName } },
			// {
			// 	$project: {
			// 		type: 1,
			// 		homepageProject: 1,
			// 		featuredProject: 1,
			// 		project: 1,
			// 		createdAt: 1,
			// 	},
			// },
			{ $sort: { createdAt: -1 } },
			{ $skip: skip },
			{ $limit: limit },
		]);

		const totalProjects = await Projects.countDocuments({
			siteName: req.params.siteName,
		});

		return res.json({
			error: false,
			message: 'Projects fetched successfully',
			payload: {
				docs: projects,
				currentPage: page,
				totalPages: Math.ceil(totalProjects / limit),
				totalProjects,
				hasNextPage: page * limit < totalProjects,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		console.error(error);
		return res.json({
			error: true,
			message: 'Something went wrong, please try again later.',
		});
	}
};

// Controller to create a project
export const createProject = async (req, res) => {
	try {
		const {
			type,
			homepageProject,
			featuredProject,
			project,
			siteName,
			fourDhomepage,
			fourDfeature,
		} = req.body;
		// Validate type and associated content
		if (
			![
				'homepage',
				'featured',
				'projects',
				'fourDhomepage',
				'fourDfeature',
			].includes(type)
		) {
			return res.status(400).json({ message: 'Invalid project type' });
		}

		const newProject = new Projects({
			type,
			homepageProject: type === 'homepage' ? homepageProject : undefined,
			featuredProject: type === 'featured' ? featuredProject : undefined,
			project: type === 'projects' ? project : undefined,
			fourDfeature: type === 'fourDfeature' ? fourDfeature : undefined,
			fourDhomepage: type === 'fourDhomepage' ? fourDhomepage : undefined,
			siteName,
		});

		await newProject.save();
		res
			.status(201)
			.json({ message: 'Project created successfully', newProject });
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Controller to get a project by ID
export const getProjectById = async (req, res) => {
	try {
		const project = await Projects.findById(req.params.id);
		if (!project) return res.status(404).json({ message: 'Project not found' });

		res.status(200).json(project);
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Controller to update a project by ID
export const updateProject = async (req, res) => {
	try {
		const updatedProject = await Projects.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		if (!updatedProject)
			return res.status(404).json({ message: 'Project not found' });

		res
			.status(200)
			.json({ message: 'Project updated successfully', updatedProject });
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Controller to delete a project by ID
export const deleteProject = async (req, res) => {
	try {
		const deletedProject = await Projects.findByIdAndDelete(req.params.id);
		if (!deletedProject)
			return res.status(404).json({ message: 'Project not found' });

		res.status(200).json({ message: 'Project deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};
