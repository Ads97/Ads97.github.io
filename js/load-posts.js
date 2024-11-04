// Add marked.js for markdown conversion
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
document.head.appendChild(script);

const POSTS_PER_PAGE = 2;
let currentPage = 1;

function createPostHTML(post) {
    return `
        <h2 class="post-title">
            <a href="posts/${post.filename.replace('.md', '.html')}">${post.title}</a>
        </h2>
        <p><span class="glyphicon glyphicon-time"></span> Posted on ${new Date(post.date).toLocaleDateString()}</p>
        <p>${post.excerpt}</p>
        <a class="btn btn-default" href="posts/${post.filename.replace('.md', '.html')}">Read More</a>
        <hr>
    `;
}

async function loadPost(filename) {
    const response = await fetch(filename);
    const text = await response.text();
    
    // Parse front matter
    const [, frontMatter, content] = text.split('---');
    const metadata = {};
    frontMatter.trim().split('\n').forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        metadata[key] = value;
    });
    
    return {
        ...metadata,
        content: marked.parse(content.trim())
    };
}

async function renderPost(templatePath, postPath) {
    const [template, post] = await Promise.all([
        fetch(templatePath).then(r => r.text()),
        loadPost(postPath)
    ]);
    
    return template
        .replace('{{title}}', post.title)
        .replace('{{date}}', new Date(post.date).toLocaleDateString())
        .replace('{{content}}', post.content);
}

// For the index page
function loadPosts() {
    fetch('posts.json')
        .then(response => response.json())
        .then(data => {
            const blogPostsContainer = document.getElementById('blog-posts');
            data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
            const endIndex = startIndex + POSTS_PER_PAGE;
            const postsToShow = data.posts.slice(startIndex, endIndex);
            
            blogPostsContainer.innerHTML = '';
            postsToShow.forEach(post => {
                blogPostsContainer.innerHTML += createPostHTML(post);
            });

            document.getElementById('prev-page').parentElement.style.display = 
                currentPage > 1 ? 'inline' : 'none';
            document.getElementById('next-page').parentElement.style.display = 
                endIndex < data.posts.length ? 'inline' : 'none';
        });
}

// For individual post pages
if (window.location.pathname.includes('/posts/')) {
    const postPath = window.location.pathname;
    renderPost('/post-template.html', postPath.replace('.html', '.md'))
        .then(html => document.documentElement.innerHTML = html);
}