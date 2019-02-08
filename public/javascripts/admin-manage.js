document.addEventListener('DOMContentLoaded', () => {
    $('.delete-user').click(function (e) {
        let userId = $(this).parent().attr('id');
        e.preventDefault();
        console.log('delete user');
        let confirmed = confirm('Are you sure you want to delete this User?');
        // console.log(confirmed);
        if (confirmed) {
            axios.post('/admin/manage-users', {
                action: {
                    delete: true,
                    user: userId
                }
            })
            $(this).parent().parent().toggle();
        }
    })
});