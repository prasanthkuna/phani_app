from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_approved', 'is_active', 'date_joined')
    list_filter = ('role', 'is_approved', 'is_active', 'date_joined')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)
    actions = ['approve_users', 'unapprove_users']
    
    fieldsets = (
        (None, {'fields': ('username', 'password', 'plain_password')}),
        ('Personal info', {'fields': ('email', 'role')}),
        ('Permissions', {'fields': ('is_approved', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_approved'),
        }),
    )

    def save_model(self, request, obj, form, change):
        if 'plain_password' in form.changed_data:
            # Save both plain text and hashed password
            obj.password = obj.plain_password  # This triggers the save method in model which will hash it
        super().save_model(request, obj, form, change)

    def approve_users(self, request, queryset):
        queryset.update(is_approved=True)
    approve_users.short_description = "Approve selected users"

    def unapprove_users(self, request, queryset):
        queryset.update(is_approved=False)
    unapprove_users.short_description = "Unapprove selected users"
