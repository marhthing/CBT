
// This is a utility function to create test users
// You should run this once to create the test accounts
export const createTestUsers = async () => {
  const testUsers = [
    {
      email: 'admin@school.com',
      password: 'admin123',
      fullName: 'School Admin',
      role: 'admin'
    },
    {
      email: 'teacher@school.com',
      password: 'teacher123',
      fullName: 'John Teacher',
      role: 'teacher'
    },
    {
      email: 'student@school.com',
      password: 'student123',
      fullName: 'Jane Student',
      role: 'student'
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        console.log(`Successfully created user: ${user.email}`);
      } else {
        const data = await response.json();
        console.error(`Error creating user ${user.email}:`, data.error);
      }
    } catch (error) {
      console.error(`Failed to create user ${user.email}:`, error);
    }
  }
};
