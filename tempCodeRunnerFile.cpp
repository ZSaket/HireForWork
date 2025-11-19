#include<bits/stdc++.h>
using namespace std;

vector<int> merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        
        int i = 0, j = 0;
        vector<int> v(m+n);
        int k = 0;
        while(i < m && j < n){

            if(nums1[i] >= nums2[j]){
                v[k] = nums2[j];
                j++;
            }
            else{
                v[k] = nums1[i];
                i++;
            }

            k++;
        }

        while(j < n){
            v[k] = nums2[j];
        }
        while(i < m){
            v[k] = nums1[i];
        }

        for(int i = 0; i < m+n; i++){
            nums1[i] = v[i];
        }

        return v;
}        

int main(){
    vector<int> nums1 = {1,2,3,0,0,0};
    int m = 3;
    vector<int> nums2 = {2,5,6};
    int n = 3;

    cout<<merge(nums1,m,nums2,n)<<endl;
}