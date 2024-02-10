
document.addEventListener('DOMContentLoaded', function() {
    var touchstartX = 0;
    var touchstartY = 0;
    var touchendX = 0;
    var touchendY = 0;
    var cellContainer = document.querySelector('.cell-container');

    cellContainer.addEventListener('touchstart', function(event) {
        touchstartX = event.touches[0].clientX;
        touchstartY = event.touches[0].clientY;
    });

    cellContainer.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].clientX;
        touchendY = event.changedTouches[0].clientY;
        handleSwipe();
    });

    function handleSwipe() {
        var deltaX = touchendX - touchstartX;
        var deltaY = touchendY - touchstartY;
        var swipeThreshold = 50; 

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            
            if (deltaX > swipeThreshold) {
                document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowRight'}));
            } else if (deltaX < -swipeThreshold) {
                
                document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowLeft'}));
            }
        } else {
            
            if (deltaY > swipeThreshold) {
                
                document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowDown'}));
            } else if (deltaY < -swipeThreshold) {
                
                document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowUp'}));
            }
        }
    }
});
