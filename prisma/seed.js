"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminPhone = process.env.DEFAULT_ADMIN_PHONE || '+919999999999';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'System Admin';
    const existingAdmin = await prisma.user.findUnique({
        where: { phone: adminPhone },
    });
    if (existingAdmin) {
        console.log('Default admin already exists:', existingAdmin.phone);
        return;
    }
    const admin = await prisma.user.create({
        data: {
            phone: adminPhone,
            name: adminName,
            role: 'ADMIN',
        },
    });
    console.log('Default admin created successfully:');
    console.log(`   Phone: ${admin.phone}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Error seeding database:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
