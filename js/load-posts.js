const POSTS_PER_PAGE = 2;
let currentPage = 1;

function createPostHTML(post) {
    return `
        <h2 class="post-title">
            <a href="posts/${post.filename}">${post.title}</a>
        </h2>
        <p><span class="glyphicon glyphicon-time"></span> Posted on ${new Date(post.date).toLocaleDateString()}</p>
        <p>${post.excerpt}</p>
        <a class="btn btn-default" href="posts/${post.filename}">Read More</a>
        <hr>
    `;
}

function loadPosts() {
    fetch('posts.json')
        .then(response => response.json())
        .then(data => {
            const blogPostsContainer = document.getElementById('blog-posts');
            // Sort posts by date (newest first)
            data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Calculate pagination
            const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
            const endIndex = startIndex + POSTS_PER_PAGE;
            const postsToShow = data.posts.slice(startIndex, endIndex);
            
            // Clear existing posts
            blogPostsContainer.innerHTML = '';
            
            // Add posts
            postsToShow.forEach(post => {
                blogPostsContainer.innerHTML += createPostHTML(post);
            });

            // Update pager visibility
            document.getElementById('prev-page').parentElement.style.display = 
                currentPage > 1 ? 'inline' : 'none';
            document.getElementById('next-page').parentElement.style.display = 
                endIndex < data.posts.length ? 'inline' : 'none';
        })
        .catch(error => console.error('Error loading posts:', error));
}

// Add event listeners for pagination
document.getElementById('prev-page').addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
        currentPage--;
        loadPosts();
    }
});

document.getElementById('next-page').addEventListener('click', (e) => {
    e.preventDefault();
    currentPage++;
    loadPosts();
});

// Initial load
loadPosts(); 