document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    
    // Guard clause
    if (!track) {
        console.error('Carousel track element not found.');
        return;
    }

    let slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-button-right');
    const prevButton = document.querySelector('.carousel-button-left');
    const dotsNav = document.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);

    // --- Setup for Infinite Loop ---
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.id = 'first-clone';
    lastClone.id = 'last-clone';
    track.appendChild(firstClone);
    track.prepend(lastClone);

    slides = Array.from(track.children);
    slides.forEach(slide => {
        slide.style.flex = '1 0 100%';
    });

    // --- State and Helper Functions ---
    let currentIndex = 1; 
    let isMoving = false; 
    let slideWidth = 0; 

    // --- NEW: Variables for Swiping ---
    let touchStartX = 0;
    let touchMoveX = 0;
    let touchStartY = 0;
    let isDragging = false;
    let dragThreshold = 50; // Min pixels to swipe to trigger a slide change

    const getSlideWidth = () => {
        if (slides.length === 0) return 0;
        const newSlideWidth = slides[0].getBoundingClientRect().width;
        dragThreshold = newSlideWidth / 4; // Set threshold to 1/4 of slide width
        return newSlideWidth;
    };

    const setPosition = (index) => {
        slideWidth = getSlideWidth(); 
        const amountToMove = slideWidth * index;
        track.style.transition = 'none';
        track.style.transform = `translateX(-${amountToMove}px)`;
    };

    const moveToSlide = (index) => {
        if (isMoving) return;
        isMoving = true;

        slideWidth = getSlideWidth();
        const amountToMove = slideWidth * index;
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = `translateX(-${amountToMove}px)`;
        
        currentIndex = index;
    };

    const updateDots = () => {
        const currentDot = dotsNav.querySelector('.active');
        if (currentDot) {
            currentDot.classList.remove('active');
        }
        const dotIndex = (currentIndex - 1 + dots.length) % dots.length;
        if (dots[dotIndex]) {
            dots[dotIndex].classList.add('active');
        }
    };

    // --- Event Listeners (Clicks) ---

    nextButton.addEventListener('click', () => {
        if (isMoving) return;
        moveToSlide(currentIndex + 1);
        updateDots();
    });

    prevButton.addEventListener('click', () => {
        if (isMoving) return;
        moveToSlide(currentIndex - 1);
        updateDots();
    });

    dotsNav.addEventListener('click', e => {
        const targetDot = e.target.closest('button');
        if (!targetDot || isMoving) return;
        if (targetDot.classList.contains('active')) {
            return; 
        }
        const targetIndex = dots.findIndex(dot => dot === targetDot);
        moveToSlide(targetIndex + 1);
        updateDots();
    });

    track.addEventListener('transitionend', () => {
        isMoving = false; 
        if (slides[currentIndex].id === 'first-clone') {
            setPosition(1);
            currentIndex = 1;
        } else if (slides[currentIndex].id === 'last-clone') {
            const realLastIndex = slides.length - 2;
            setPosition(realLastIndex);
            currentIndex = realLastIndex;
        }
    });

    window.addEventListener('resize', () => {
        setPosition(currentIndex);
    });

    // --- NEW: Touch Event Handlers ---

    const handleTouchStart = (e) => {
        if (isMoving) return;
        isDragging = false; // Reset dragging flag
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY; // For vertical scroll detection
        touchMoveX = touchStartX;
        track.style.transition = 'none'; // Remove animation while dragging
    };

    const handleTouchMove = (e) => {
        if (isMoving) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - touchStartX;
        const diffY = currentY - touchStartY;

        if (!isDragging) {
            // Check if swipe is more horizontal than vertical
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isDragging = true; // Start dragging
            } else {
                // Vertical scroll, do nothing
                return;
            }
        }

        // If dragging, prevent page scroll and move the track
        if (isDragging) {
            e.preventDefault(); // Prevents vertical scrolling
            touchMoveX = currentX;
            const currentPosition = -(currentIndex * slideWidth);
            const newPosition = currentPosition + diffX;
            track.style.transform = `translateX(${newPosition}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (isMoving || !isDragging) {
            isDragging = false; // Ensure dragging is reset
            return; // Wasn't a valid drag
        }

        isDragging = false;
        const diff = touchMoveX - touchStartX;
        track.style.transition = 'transform 0.4s ease-in-out'; // Add animation back

        if (diff < -dragThreshold) {
            // Swiped left
            moveToSlide(currentIndex + 1);
            updateDots();
        } else if (diff > dragThreshold) {
            // Swiped right
            moveToSlide(currentIndex - 1);
            updateDots();
        } else {
            // Not swiped far enough, snap back
            moveToSlide(currentIndex);
        }
    };

    // --- NEW: Add Touch Listeners to the Track ---
    // We set 'passive: false' on touchmove to allow e.preventDefault()
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    track.addEventListener('touchmove', handleTouchMove, { passive: false });
    track.addEventListener('touchend', handleTouchEnd);
    track.addEventListener('touchcancel', handleTouchEnd); // Handle cancelled touches

    // --- Initial Setup ---
    setPosition(currentIndex); 
    updateDots(); 
});