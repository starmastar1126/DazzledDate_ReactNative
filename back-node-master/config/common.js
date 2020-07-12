module.exports.commonFunc = {
    timeAgo : function(dateString) {
        var createdDate = new Date(dateString);
        var nowDate = new Date();
    
        var diffSecond = Math.floor((nowDate.getTime() - createdDate.getTime())/1000);
        if (diffSecond < 5) return 'now';
        if (diffSecond < 60 ) return(diffSecond + ' sec ago');
    
        var diffMinute = Math.floor(diffSecond/60);
        if (diffMinute < 60) return(diffMinute + ' mins ago');
    
        var diffHours = Math.floor(diffMinute/60);
        if ( 0 < diffHours && diffHours < 24) return(diffHours + ' hours ago');
    
        var diffDate = Math.floor(diffHours/24);
        if (diffDate > 0 && diffDate < 31) return(diffDate + ' days ago');
    
        var diffMonth = Math.floor(diffDate/30);    
        if (diffMonth > 0 && diffMonth < 12) return(diffMonth + ' months ago');
    
        var diffYears = Math.floor(diffMonth/12);
        if (diffYears > 0) return(diffYears + ' years ago');    
    }
}