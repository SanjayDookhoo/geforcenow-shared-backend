import 'dotenv/config';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

const { EMAIL, PASSWORD } = process.env;

const imapConfig = {
	user: EMAIL,
	password: PASSWORD,
	host: 'smtp.gmail.com',
	port: 993,
	tls: true,
	tlsOptions: {
		rejectUnauthorized: false, // fixes error, Connection error: Error: self signed certificate
	},
};

const fromEmail = 'sanjaydookhoo@msn.com';
const subjectEmail = 'x';
// const fromEmail = 'account@tmail.nvidia.com'
// const subjectEmail = 'Authenticate Your Email Address'

try {
	const imap = new Imap(imapConfig);

	imap.once('ready', () => {
		setInterval(function () {
			getEmails(imap);
		}, 1000);
	});

	imap.once('error', (err) => {
		console.log(err);
	});

	imap.once('end', () => {
		console.log('Connection ended');
	});

	imap.connect();
} catch (e) {}

const getEmails = (imap) => {
	imap.openBox('INBOX', false, () => {
		imap.search(
			['UNSEEN', ['SINCE', new Date('12/03/2022')]], //TODO: remove range only needed for testing
			(err, results) => {
				if (!results || results.length == 0) {
					console.log('no results');
					return;
				}

				const f = imap.fetch(results, { bodies: '' });
				f.on('message', (msg) => {
					msg.on('body', (stream) => {
						simpleParser(stream, async (err, parsed) => {
							const { from, subject, textAsHtml, text } = parsed;

							if (from.text.includes(fromEmail) && subject == subjectEmail) {
								console.log({ text });
							}
						});
					});
					msg.once('attributes', (attrs) => {
						const { uid } = attrs;
						imap.addFlags(uid, ['\\Seen'], () => {
							// Mark the email as read after reading it
							console.log('Marked as read!');
						});
					});
				});
				f.once('error', (ex) => {
					return Promise.reject(ex);
				});
				f.once('end', () => {
					console.log('Done fetching all messages!');
					imap.end();
				});
			}
		);
	});
};
