import { Employee, Payslip, PayrollPeriod } from '../types'

export interface PayrollCalculationInput {
  employee: Employee
  payrollPeriod: PayrollPeriod
  overtimeHours?: number
  actualDaysWorked?: number
  additionalBonuses?: { name: string; amount: number }[]
  additionalDeductions?: { name: string; amount: number }[]
}

export interface PayrollCalculationResult {
  basicSalary: number
  overtimePay: number
  allowances: { name: string; amount: number }[]
  totalEarnings: number
  deductions: { name: string; amount: number; mandatory: boolean }[]
  totalDeductions: number
  netSalary: number
}

export class PayrollCalculationService {
  /**
   * Calculate working days in a period (excluding weekends)
   */
  static calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return count
  }

  /**
   * Calculate basic salary based on employee type and working days
   */
  static calculateBasicSalary(
    employee: Employee, 
    totalWorkingDays: number, 
    actualDaysWorked: number
  ): number {
    switch (employee.salary.type) {
      case 'MONTHLY':
        // For monthly salary, calculate based on worked days ratio
        return (employee.salary.amount * actualDaysWorked) / totalWorkingDays
      
      case 'HOURLY':
        // For hourly, assume 8 hours per day
        return employee.salary.amount * actualDaysWorked * 8
      
      case 'FIXED':
        // Fixed salary regardless of days worked
        return employee.salary.amount
      
      default:
        return 0
    }
  }

  /**
   * Calculate overtime pay
   */
  static calculateOvertimePay(
    employee: Employee, 
    overtimeHours: number = 0
  ): number {
    if (overtimeHours <= 0) return 0

    const overtimeRate = employee.payrollSettings.overtimeRate || 1.5
    let hourlyRate = 0

    switch (employee.salary.type) {
      case 'MONTHLY':
        // Assume 22 working days * 8 hours per day
        hourlyRate = employee.salary.amount / (22 * 8)
        break
      
      case 'HOURLY':
        hourlyRate = employee.salary.amount
        break
      
      case 'FIXED':
        // For fixed salary, calculate based on total hours in period
        hourlyRate = employee.salary.amount / (22 * 8)
        break
    }

    return hourlyRate * overtimeRate * overtimeHours
  }

  /**
   * Calculate allowances
   */
  static calculateAllowances(
    employee: Employee, 
    basicSalary: number
  ): { name: string; amount: number }[] {
    const allowances: { name: string; amount: number }[] = []
    
    if (employee.payrollSettings.allowances) {
      for (const allowance of employee.payrollSettings.allowances) {
        let amount = 0
        
        if (allowance.type === 'FIXED') {
          amount = allowance.amount
        } else if (allowance.type === 'PERCENTAGE') {
          amount = (basicSalary * allowance.amount) / 100
        }
        
        allowances.push({
          name: allowance.name,
          amount: Math.round(amount * 1000) / 1000 // Round to 3 decimal places
        })
      }
    }
    
    return allowances
  }

  /**
   * Calculate deductions
   */
  static calculateDeductions(
    employee: Employee, 
    grossSalary: number
  ): { name: string; amount: number; mandatory: boolean }[] {
    const deductions: { name: string; amount: number; mandatory: boolean }[] = []
    
    if (employee.payrollSettings.deductions) {
      for (const deduction of employee.payrollSettings.deductions) {
        let amount = 0
        
        if (deduction.type === 'FIXED') {
          amount = deduction.amount
        } else if (deduction.type === 'PERCENTAGE') {
          amount = (grossSalary * deduction.amount) / 100
        }
        
        deductions.push({
          name: deduction.name,
          amount: Math.round(amount * 1000) / 1000, // Round to 3 decimal places
          mandatory: deduction.mandatory
        })
      }
    }
    
    return deductions
  }

  /**
   * Calculate complete payroll for an employee
   */
  static calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
    const { employee, payrollPeriod, overtimeHours = 0 } = input
    
    // Calculate working days
    const totalWorkingDays = this.calculateWorkingDays(
      payrollPeriod.startDate, 
      payrollPeriod.endDate
    )
    const actualDaysWorked = input.actualDaysWorked || totalWorkingDays
    
    // Calculate basic salary
    const basicSalary = this.calculateBasicSalary(
      employee, 
      totalWorkingDays, 
      actualDaysWorked
    )
    
    // Calculate overtime pay
    const overtimePay = this.calculateOvertimePay(employee, overtimeHours)
    
    // Calculate allowances
    const allowances = this.calculateAllowances(employee, basicSalary)
    
    // Add any additional bonuses
    if (input.additionalBonuses) {
      allowances.push(...input.additionalBonuses)
    }
    
    // Calculate total earnings
    const totalEarnings = basicSalary + overtimePay + 
      allowances.reduce((sum, allowance) => sum + allowance.amount, 0)
    
    // Calculate deductions
    const deductions = this.calculateDeductions(employee, totalEarnings)
    
    // Add any additional deductions
    if (input.additionalDeductions) {
      deductions.push(
        ...input.additionalDeductions.map(deduction => ({
          ...deduction,
          mandatory: false
        }))
      )
    }
    
    // Calculate total deductions
    const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0)
    
    // Calculate net salary
    const netSalary = Math.max(0, totalEarnings - totalDeductions)
    
    return {
      basicSalary: Math.round(basicSalary * 1000) / 1000,
      overtimePay: Math.round(overtimePay * 1000) / 1000,
      allowances,
      totalEarnings: Math.round(totalEarnings * 1000) / 1000,
      deductions,
      totalDeductions: Math.round(totalDeductions * 1000) / 1000,
      netSalary: Math.round(netSalary * 1000) / 1000
    }
  }

  /**
   * Generate a payslip from calculation result
   */
  static generatePayslip(
    employee: Employee,
    payrollPeriod: PayrollPeriod,
    calculation: PayrollCalculationResult,
    input: PayrollCalculationInput,
    createdBy: string
  ): Omit<Payslip, 'id'> {
    const totalWorkingDays = this.calculateWorkingDays(
      payrollPeriod.startDate, 
      payrollPeriod.endDate
    )
    
    return {
      employeeId: employee.id,
      payrollPeriodId: payrollPeriod.id,
      startDate: payrollPeriod.startDate,
      endDate: payrollPeriod.endDate,
      workingDays: totalWorkingDays,
      actualDaysWorked: input.actualDaysWorked || totalWorkingDays,
      overtimeHours: input.overtimeHours || 0,
      basicSalary: calculation.basicSalary,
      overtimePay: calculation.overtimePay,
      allowances: calculation.allowances,
      totalEarnings: calculation.totalEarnings,
      deductions: calculation.deductions,
      totalDeductions: calculation.totalDeductions,
      netSalary: calculation.netSalary,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    }
  }

  /**
   * Validate payroll calculation inputs
   */
  static validateCalculationInput(input: PayrollCalculationInput): string[] {
    const errors: string[] = []
    
    if (!input.employee) {
      errors.push('Employee is required')
    }
    
    if (!input.payrollPeriod) {
      errors.push('Payroll period is required')
    }
    
    if (input.employee && input.employee.salary.amount <= 0) {
      errors.push('Employee must have a valid salary amount')
    }
    
    if (input.overtimeHours && input.overtimeHours < 0) {
      errors.push('Overtime hours cannot be negative')
    }
    
    if (input.actualDaysWorked && input.actualDaysWorked < 0) {
      errors.push('Actual days worked cannot be negative')
    }
    
    if (input.payrollPeriod && input.payrollPeriod.startDate >= input.payrollPeriod.endDate) {
      errors.push('Payroll period end date must be after start date')
    }
    
    return errors
  }

  /**
   * Calculate payroll summary for multiple employees
   */
  static calculatePayrollSummary(
    employees: Employee[],
    payrollPeriod: PayrollPeriod,
    inputs: Record<string, PayrollCalculationInput>
  ) {
    let totalBasic = 0
    let totalOvertime = 0
    let totalAllowances = 0
    let totalDeductions = 0
    let totalNet = 0
    
    const payslips: Omit<Payslip, 'id'>[] = []
    
    for (const employee of employees) {
      const input = inputs[employee.id] || {
        employee,
        payrollPeriod,
        overtimeHours: 0,
        actualDaysWorked: this.calculateWorkingDays(payrollPeriod.startDate, payrollPeriod.endDate)
      }
      
      const calculation = this.calculatePayroll(input)
      const payslip = this.generatePayslip(employee, payrollPeriod, calculation, input, 'system')
      
      payslips.push(payslip)
      
      totalBasic += calculation.basicSalary
      totalOvertime += calculation.overtimePay
      totalAllowances += calculation.allowances.reduce((sum, a) => sum + a.amount, 0)
      totalDeductions += calculation.totalDeductions
      totalNet += calculation.netSalary
    }
    
    return {
      payslips,
      summary: {
        totalEmployees: employees.length,
        totalBasic: Math.round(totalBasic * 1000) / 1000,
        totalOvertime: Math.round(totalOvertime * 1000) / 1000,
        totalAllowances: Math.round(totalAllowances * 1000) / 1000,
        totalDeductions: Math.round(totalDeductions * 1000) / 1000,
        totalNet: Math.round(totalNet * 1000) / 1000
      }
    }
  }
}
