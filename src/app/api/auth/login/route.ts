import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual authentication logic with database
    // This is a placeholder implementation
    const user = {
      id: '1',
      email: email,
      firstName: null,
      lastName: null,
    };

    return NextResponse.json(
      { success: true, user, token: 'temp-token' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}