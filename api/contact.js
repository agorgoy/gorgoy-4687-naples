const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const REALTOR_EMAIL = 'daylet.realtor@gmail.com';
const OWNER_EMAIL   = 'gorgoyhomes@gmail.com';
const PROPERTY_ADDR = '4687 14th Ave SE, Naples, FL 34117';

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { firstName, lastName, email, phone, buyerType, message } = req.body || {};

    if (!firstName || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    // ── Save lead to Supabase ──────────────────────────────────────────────
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        const { error } = await supabase.from('leads').insert({
            first_name:  firstName,
            last_name:   lastName,
            email,
            phone:       phone || null,
            buyer_type:  buyerType || null,
            message:     message || null,
            property:    PROPERTY_ADDR,
        });

        if (error) console.error('[Supabase]', error.message);
    } catch (err) {
        console.error('[Supabase init]', err.message);
    }

    // ── Send email via Resend ──────────────────────────────────────────────
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from:     'Gorgoy Homes <onboarding@resend.dev>',
            to:       [REALTOR_EMAIL],
            cc:       [OWNER_EMAIL],
            reply_to: email,
            subject:  `New Showing Request — ${PROPERTY_ADDR}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                    <div style="background:#111;padding:24px 32px">
                        <p style="color:#c8a96e;font-size:12px;letter-spacing:4px;text-transform:uppercase;margin:0">
                            Gorgoy Homes Inc
                        </p>
                    </div>
                    <div style="padding:32px;border:1px solid #e8e8e8;border-top:none">
                        <h2 style="color:#111;font-size:20px;margin:0 0 24px">
                            New Inquiry — ${PROPERTY_ADDR}
                        </h2>
                        <table style="width:100%;border-collapse:collapse">
                            <tr style="border-bottom:1px solid #eee">
                                <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:35%">Name</td>
                                <td style="padding:10px 0;font-weight:600">${fullName}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #eee">
                                <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Email</td>
                                <td style="padding:10px 0"><a href="mailto:${email}" style="color:#c8a96e">${email}</a></td>
                            </tr>
                            <tr style="border-bottom:1px solid #eee">
                                <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Phone</td>
                                <td style="padding:10px 0">${phone || 'Not provided'}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #eee">
                                <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">I am a</td>
                                <td style="padding:10px 0">${buyerType || 'Not specified'}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top">Message</td>
                                <td style="padding:10px 0">${message || '—'}</td>
                            </tr>
                        </table>
                        <div style="margin-top:32px;padding:16px;background:#f6f6f4;border-left:3px solid #c8a96e">
                            <p style="margin:0;font-size:13px;color:#555">
                                Hit Reply to respond directly to ${fullName} at <strong>${email}</strong>
                            </p>
                        </div>
                    </div>
                    <div style="padding:16px 32px;background:#f6f6f4;text-align:center">
                        <p style="margin:0;font-size:11px;color:#aaa">
                            Gorgoy Homes Inc &bull; Naples, Florida &bull; gorgoyhomes@gmail.com
                        </p>
                    </div>
                </div>
            `,
        });
    } catch (err) {
        console.error('[Resend]', err.message);
        return res.status(500).json({ error: 'Email delivery failed' });
    }

    return res.status(200).json({ success: true });
};
