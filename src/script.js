document.addEventListener('DOMContentLoaded', function() {
    const selectors = {
        container: document.getElementById('postsContainer'),
        pagination: document.getElementById('pagination')
    };

    const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
    const COMMENTS_URL = 'https://jsonplaceholder.typicode.com/comments';
    const postsPerPage = 10;
    let currentPage = 1;

    function buildPost(postData, commentsData) {
        const postContainer = document.createElement('div');
        postContainer.classList.add('post');
        postContainer.innerHTML = `
            <h2 class="post__title">#${postData.id} | ${postData.title}</h2>
            <p class="post__body">${postData.body}</p>
            <h3 class="post__comments">Комментарии:</h3>
        `;

        const commentsContainer = document.createElement('div');
        commentsContainer.classList.add('comments');
        commentsContainer.style.display = 'none';
        commentsData.slice(0, 5).forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');
            commentElement.innerHTML = `
                <p class="comment__title">${comment.email}</p>
                <p class="comment__body">${comment.body}</p>
            `;
            commentsContainer.appendChild(commentElement);
        });
        postContainer.appendChild(commentsContainer);

        const commentsButton = document.createElement('button');
        commentsButton.classList.add('comments__button');
        commentsButton.textContent = 'показать';
        commentsButton.addEventListener('click', function() {
            commentsContainer.style.display = commentsContainer.style.display === 'none' ? 'block' : 'none';
            commentsButton.textContent = commentsContainer.style.display === 'none' ? 'показать' : 'скрыть';
        });
        postContainer.appendChild(commentsButton);

        return postContainer;
    }

    function fetchPosts() {
        fetch(`${POSTS_URL}?_limit=${postsPerPage}&_page=${currentPage}&_sort=id&_order=asc`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                return response.json();
            })
            .then((posts) => {
                const postPromises = posts.map(post => {
                    return fetch(`${COMMENTS_URL}?postId=${post.id}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch comments');
                            }
                            return response.json();
                        })
                        .then(comments => buildPost(post, comments))
                });
                Promise.all(postPromises)
                    .then(postsElements => {
                        selectors.container.innerHTML = '';
                        const fragment = document.createDocumentFragment();
                        postsElements.forEach(element => fragment.appendChild(element));
                        selectors.container.appendChild(fragment);
                    });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    async function fetchTotalPosts() {
        try {
            const response = await fetch(POSTS_URL + '?_start=0&_end=1');
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            const totalCount = response.headers.get('X-Total-Count');
            return parseInt(totalCount);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function renderPagination(totalPosts) {
        const totalPages = Math.ceil(totalPosts / postsPerPage);
        selectors.pagination.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.classList.add(currentPage === 1 ? 'pagination__button-inactive' : 'pagination__button');
        prevButton.disabled = currentPage === 1;
        prevButton.textContent = 'Предыдущая страница';
        prevButton.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                fetchPosts(currentPage);
                renderPagination(totalPosts);
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        });
        selectors.pagination.appendChild(prevButton);

        const currentPageInfo = document.createElement('span');
        currentPageInfo.classList.add('pagination__current');
        currentPageInfo.textContent = currentPage.toString();
        selectors.pagination.appendChild(currentPageInfo);

        const nextButton = document.createElement('button');
        nextButton.classList.add(currentPage === totalPosts ? 'pagination__button-inactive' : 'pagination__button');
        nextButton.disabled = currentPage === totalPosts;
        nextButton.textContent = 'Следующая страница';
        nextButton.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                fetchPosts(currentPage);
                renderPagination(totalPosts);
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        });
        selectors.pagination.appendChild(nextButton);
    }

    fetchPosts();
    fetchTotalPosts().then(totalPosts => {
        renderPagination(totalPosts);
    });
});