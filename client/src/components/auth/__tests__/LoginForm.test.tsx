import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import LoginForm from '../LoginForm'

// Mock the auth context
const mockSignIn = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    renderWithProviders(<LoginForm />)
    
    expect(screen.getByText('Sign in to Smart Brain')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows password when toggle button is clicked', () => {
    renderWithProviders(<LoginForm />)
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    fireEvent.click(toggleButton)
    
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('validates required fields', async () => {
    renderWithProviders(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    fireEvent.click(submitButton)
    
    // HTML5 validation should prevent form submission
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your email')).toBeInvalid()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInvalid()
    })
  })

  it('navigates to signup page when signup link is clicked', () => {
    renderWithProviders(<LoginForm />)
    
    const signupLink = screen.getByText('Sign up')
    fireEvent.click(signupLink)
    
    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })
}) 