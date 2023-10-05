const express = require('express');
const lodash = require('lodash');
const app = express();
const PORT = process.env.PORT || 3000;

const options = {
  method: "get",
  headers: {
    'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
  }
};

const fetchBlogData = lodash.memoize(async () => {
  try {
    const response = await fetch('https://intent-kit-16.hasura.app/api/rest/blogs', options);
    const resp = await response.json()
    return resp;
  } catch (error) {
    console.error(error);
  }
}, () => 'cacheKey'); 

const analyzeData = (blogData) => {
  const totalNumberOfBlogs = blogData.blogs.length;
  const longestBlog = lodash.maxBy(blogData.blogs, 'title.length');
  const blogsContainingPrivacy = lodash.filter(blogData.blogs, (blog) =>
    blog.title.toLowerCase().includes('privacy')
  ).length;
  const uniqueTitles = lodash.uniqBy(blogData.blogs, 'title');

  return {
    totalNumberOfBlogs,
    longestTitleBlog: longestBlog.title,
    blogsWithPrivacyTitle: blogsContainingPrivacy,
    ArrayOfuniqueBlogTitles: uniqueTitles.map((blog) => blog.title),
  };
};

const searchBlogs = (blogData, query) => {
  if (!query) {
    return [];
  }
  return blogData.blogs.filter((blog) =>
    blog.title.toLowerCase().includes(query.toLowerCase())
  );
};


app.get('/api/blog-stats', async (req, res) => {
  const data = await fetchBlogData();
  const stats = analyzeData(data);
  res.json(stats);
});


app.get('/api/blog-search', async (request, response) => {
  const { query } = request.query;
  const blogData = await fetchBlogData(); 

  if (!query) {
    return response.status(400).json({ error: 'No query parameter, query is required.' });
  }

  const matchingBlogs = searchBlogs(blogData, query);
  response.json(matchingBlogs);
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
