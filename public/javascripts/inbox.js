document.addEventListener('DOMContentLoaded', () => {


    $('.sent-mail').toggle();

    $('.delete-mail').click(function () {
        let mailId = $(this).attr('data-mail');

        console.log(mailId);
        let confirmDelete = confirm('Are you sure you want to delete this message?');
        if (confirmDelete) {
            axios.post('/inbox', {
                action: {
                    delete: true,
                    many: false,
                    messageId: mailId
                }
            })
            $(this).parent().parent().toggle();
        }
    });

    $('#delete-all-mail').click(function () {

        let checkedMailIds = [];
        let checkedMail = $("input:checked");
        for (mail of checkedMail) {
            checkedMailIds.push(mail.dataset.mail);
        }
        if (checkedMailIds.length > 0) {
            let confirmDelete = confirm('Are you sure you want to delete these messages?');
            if (confirmDelete) {
                axios.post('/inbox', {
                    action: {
                        delete: true,
                        many: true,
                        messageIds: checkedMailIds
                    }
                })
                for (mail of checkedMail) {
                    mail.parentElement.parentElement.hidden = true;
                }
            }
        } else {
            alert(`You haven't selected any messages to delete`);
        }
    });

    $('#sent-mail').click(function () {
        $('.sent-mail').show();
        $('#inbox-mail').hide();
    });
    $('#in-mail').click(function () {
        $('.sent-mail').hide();
        $('#inbox-mail').show();
    });
    $('#send-message').click(function (e) {
        console.log('sending a message!');
        const to = $('#inputUserName').val();
        const message = $('#message-body').val();
        console.log('to:', to);
        axios.post('/inbox', {
            action: {
                send: true,
                to: to,
                message: message
            }
        });
        location.reload();

    });
});